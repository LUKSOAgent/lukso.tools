#!/usr/bin/env python3
"""
Resolution Checker — Checks outcomes of placed Polymarket fast market trades.

Source of truth: Polymarket activity API (ALL wallet trades, not just bot-logged).
Falls back to fastmarket_pnl.jsonl for entries missing from the API.

Records win/loss/payout to fastmarket_outcomes.jsonl and generates daily summary.

Run periodically (cron every 15–30 min) or on-demand.
"""

import json
import sys
import time
import requests
from datetime import datetime, timezone, date, timedelta
from pathlib import Path
from typing import Optional

SKILL_DIR = Path(__file__).parent
PNL_FILE = SKILL_DIR / "fastmarket_pnl.jsonl"
OUTCOMES_FILE = SKILL_DIR / "fastmarket_outcomes.jsonl"
SUMMARY_FILE = SKILL_DIR / "fastmarket_daily_summary.jsonl"
NOTIFY_FILE = SKILL_DIR / ".trade_notification"

POLYMARKET_FEE = 0.10  # 10% fee on winnings

# Wallet to monitor — all trades here will be tracked, regardless of source
WALLET_ADDRESS = "0x46a89fe8123840906af6f1b3a0f24c891dbb9baa"


def load_pnl_entries():
    """Load all trade entries from PnL file."""
    entries = []
    if not PNL_FILE.exists():
        return entries
    with open(PNL_FILE) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return entries


def load_resolved():
    """Load already-resolved window timestamps to avoid re-checking."""
    resolved = set()
    if not OUTCOMES_FILE.exists():
        return resolved
    with open(OUTCOMES_FILE) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                resolved.add(entry.get("window", 0))
            except json.JSONDecodeError:
                continue
    return resolved


def load_all_outcomes():
    """Load all outcome entries."""
    outcomes = []
    if not OUTCOMES_FILE.exists():
        return outcomes
    with open(OUTCOMES_FILE) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                outcomes.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return outcomes


def fetch_wallet_trades(limit: int = 200) -> list:
    """Fetch all TRADE entries from Polymarket activity API for our wallet.

    Returns list of dicts with normalized fields:
        window, slug, title, amount_usdc, shares, price, tx_hash, timestamp
    """
    try:
        url = f"https://data-api.polymarket.com/activity?user={WALLET_ADDRESS}&limit={limit}"
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"  [activity API] Error: {e}", file=sys.stderr)
        return []

    trades = []
    for item in data:
        if item.get("type") != "TRADE":
            continue
        slug = item.get("slug", "")
        # Extract window timestamp from slug: btc-updown-5m-{window_ts}
        window_ts = None
        if slug.startswith("btc-updown-5m-"):
            try:
                window_ts = int(slug.split("-")[-1])
            except ValueError:
                pass
        if window_ts is None:
            continue

        trades.append({
            "window": window_ts,
            "slug": slug,
            "title": item.get("title", ""),
            "amount_usdc": float(item.get("usdcSize", 0)),
            "shares": float(item.get("size", 0)),
            "price": float(item.get("price", 0)),
            "side": item.get("side", "BUY"),
            "tx_hash": item.get("transactionHash", ""),
            "timestamp": item.get("timestamp", 0),
        })
    return trades


def fetch_wallet_redeems(limit: int = 200) -> dict:
    """Fetch all REDEEM entries and index by window timestamp → usdc_redeemed."""
    try:
        url = f"https://data-api.polymarket.com/activity?user={WALLET_ADDRESS}&limit={limit}"
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"  [activity API redeems] Error: {e}", file=sys.stderr)
        return {}

    redeems = {}
    for item in data:
        if item.get("type") != "REDEEM":
            continue
        slug = item.get("slug", "")
        if slug.startswith("btc-updown-5m-"):
            try:
                window_ts = int(slug.split("-")[-1])
                redeems[window_ts] = redeems.get(window_ts, 0) + float(item.get("usdcSize", 0))
            except ValueError:
                pass
    return redeems


def build_pending_from_activity(resolved_windows: set) -> list:
    """Build a list of unresolved trade windows using the Polymarket activity API.

    Groups trades by window, sums invested USDC, and skips already-resolved windows.
    Returns list of dicts compatible with check_resolutions() pending format.
    """
    raw_trades = fetch_wallet_trades()
    if not raw_trades:
        return []

    # Group by window
    by_window = {}
    for t in raw_trades:
        w = t["window"]
        if w in resolved_windows:
            continue
        if w not in by_window:
            by_window[w] = {
                "window": w,
                "title": t["title"],
                "slug": t["slug"],
                "amount": 0.0,
                "shares": 0.0,
                "timestamp": t["timestamp"],
                "source": "activity_api",
            }
        by_window[w]["amount"] += t["amount_usdc"]
        by_window[w]["shares"] += t["shares"]

    # Convert to list sorted by window time
    pending = sorted(by_window.values(), key=lambda x: x["window"])
    return pending


def get_market_resolution(window_ts: int) -> Optional[dict]:
    """Check if a 5-min market has resolved and get the outcome.
    
    Returns dict with:
        resolved: bool
        outcome: "Up" | "Down" | None
        resolution_price: float (Chainlink price at end)
        opening_price: float (Chainlink price at start)
    """
    slug = f"btc-updown-5m-{window_ts}"
    
    try:
        resp = requests.get(
            f"https://gamma-api.polymarket.com/events?slug={slug}",
            timeout=10,
        )
        data = resp.json()
        if not data:
            return None
        
        ev = data[0]
        markets = ev.get("markets", [])
        if not markets:
            return None
        
        m = markets[0]
        
        # Check resolution status
        # Polymarket uses "resolution" field or check if market is closed
        resolved = m.get("resolved", False)
        active = m.get("active", True)
        closed = m.get("closed", False)
        
        # Get outcome from tokens
        outcome_str = m.get("outcome", "")  # "Yes" or "No" for the Up token
        
        # Parse outcome prices — if resolved, one token = $1, other = $0
        outcome_prices = m.get("outcomePrices")
        if outcome_prices:
            if isinstance(outcome_prices, str):
                outcome_prices = json.loads(outcome_prices)
            # outcomePrices[0] = Up token price, outcomePrices[1] = Down token price
            up_price = float(outcome_prices[0]) if len(outcome_prices) > 0 else 0.5
            down_price = float(outcome_prices[1]) if len(outcome_prices) > 1 else 0.5
        else:
            up_price = 0.5
            down_price = 0.5
        
        # Determine resolution
        if resolved or closed or not active:
            # Market has resolved
            if up_price > 0.95:
                outcome = "UP"
            elif down_price > 0.95:
                outcome = "DOWN"
            elif outcome_str.lower() in ("yes", "up"):
                outcome = "UP"
            elif outcome_str.lower() in ("no", "down"):
                outcome = "DOWN"
            else:
                # Try to determine from description
                desc = m.get("description", "").lower()
                question = m.get("question", "").lower()
                if "higher" in outcome_str.lower() or "up" in outcome_str.lower():
                    outcome = "UP"
                elif "lower" in outcome_str.lower() or "down" in outcome_str.lower():
                    outcome = "DOWN"
                else:
                    outcome = None
            
            return {
                "resolved": True,
                "outcome": outcome,
                "up_price": up_price,
                "down_price": down_price,
                "raw_outcome": outcome_str,
                "title": ev.get("title", slug),
            }
        else:
            # Not yet resolved
            return {
                "resolved": False,
                "outcome": None,
                "up_price": up_price,
                "down_price": down_price,
                "title": ev.get("title", slug),
            }
            
    except Exception as e:
        print(f"  Error checking {slug}: {e}", file=sys.stderr)
        return None


def check_resolutions():
    """Main: check all unresolved trades and record outcomes.

    Uses Polymarket activity API as primary source of truth (catches ALL wallet trades,
    including manual and non-bot trades). Falls back to fastmarket_pnl.jsonl for any
    entries the API missed (e.g. very old data outside the 200-entry limit).

    For windows where a REDEEM is already on-chain: uses exact payout from the API
    instead of estimating. This gives accurate P&L regardless of buy price.
    """
    resolved_windows = load_resolved()

    # ── Primary source: Polymarket activity API ──────────────────────────────
    print("Fetching wallet activity from Polymarket API...")
    activity_pending = build_pending_from_activity(resolved_windows)
    redeems_by_window = fetch_wallet_redeems()

    # ── Secondary source: fastmarket_pnl.jsonl ───────────────────────────────
    pnl_entries = load_pnl_entries()
    pnl_windows = {e.get("window", 0) for e in pnl_entries if e.get("window")}
    activity_windows = {p["window"] for p in activity_pending}
    # Add pnl entries not already covered by activity API
    pnl_only = [
        e for e in pnl_entries
        if (e.get("filled", False) or e.get("success", False))
        and e.get("window", 0) not in resolved_windows
        and e.get("window", 0) not in activity_windows
    ]

    # Combine — activity API first, pnl-only entries appended
    all_pending = activity_pending + [
        {
            "window": e["window"],
            "title": "",
            "slug": f"btc-updown-5m-{e['window']}",
            "amount": e.get("amount", 0),
            "shares": 0,
            "timestamp": 0,
            "source": "pnl_file",
            "_pnl_entry": e,
        }
        for e in pnl_only
    ]

    if not all_pending:
        print("No pending trades to check.")
        return

    total_from_api = len(activity_pending)
    total_from_pnl = len(pnl_only)
    print(f"Pending: {total_from_api} from activity API + {total_from_pnl} from pnl file = {len(all_pending)} total")

    new_outcomes = []
    wins = 0
    losses = 0
    now = int(time.time())

    for entry in all_pending:
        ws = entry["window"]
        amount = round(entry["amount"], 4)
        source = entry.get("source", "activity_api")
        pnl_entry = entry.get("_pnl_entry", {})

        # Skip very recent windows (< 10 min since window ended)
        window_end = ws + 300
        if now - window_end < 600:
            print(f"  Window {ws}: too recent, skipping")
            continue

        # If we already have a redeem on-chain, we know the outcome exactly
        actual_payout = redeems_by_window.get(ws)
        if actual_payout is not None:
            # Exact P&L from chain — no estimation needed
            net = round(actual_payout - amount, 4)
            won = actual_payout > 0.01
            direction = pnl_entry.get("direction", "UNKNOWN")
            # Still fetch market resolution to get the outcome direction label
            result = get_market_resolution(ws)
            market_outcome = result["outcome"] if result else "UNKNOWN"
            if won:
                wins += 1
                print(f"  ✅ Window {ws}: WON (on-chain) ${amount:.2f} → ${actual_payout:.2f} (net +${net:.2f})")
            else:
                losses += 1
                print(f"  ❌ Window {ws}: LOST (on-chain) -${amount:.2f}")

            outcome_record = {
                "window": ws,
                "time": datetime.utcfromtimestamp(entry.get("timestamp") or ws).isoformat() + "+00:00",
                "direction": direction,
                "amount": amount,
                "market_outcome": market_outcome or ("WIN" if won else "LOSS"),
                "win": won,
                "payout": round(actual_payout, 4),
                "net_pnl": net,
                "btc_price": pnl_entry.get("btc_price", 0),
                "confidence": pnl_entry.get("confidence", 0),
                "divergence_pct": pnl_entry.get("divergence_pct", 0),
                "signal": pnl_entry.get("signal", ""),
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "title": entry.get("title") or (result["title"] if result else ""),
                "version": pnl_entry.get("version", source),
                "pnl_source": "on_chain_redeem",
            }
            new_outcomes.append(outcome_record)
            continue

        # No redeem on-chain — check if market resolved via Gamma API.
        # If resolved and no redeem: it's a LOSS (tokens worth $0, nothing to redeem).
        result = get_market_resolution(ws)
        if result is None:
            print(f"  Window {ws}: API error, skipping")
            continue
        if not result["resolved"]:
            print(f"  Window {ws}: not yet resolved")
            continue

        # Market resolved + no redeem = loss. Simple.
        market_outcome = result.get("outcome", "UNKNOWN") or "UNKNOWN"
        direction = pnl_entry.get("direction", "UNKNOWN")
        losses += 1
        print(f"  ❌ Window {ws}: LOST (no redeem, market resolved → {market_outcome}) -${amount:.2f}")

        outcome_record = {
            "window": ws,
            "time": datetime.utcfromtimestamp(entry.get("timestamp") or ws).isoformat() + "+00:00",
            "direction": direction,
            "amount": amount,
            "market_outcome": market_outcome,
            "win": False,
            "payout": 0,
            "net_pnl": round(-amount, 4),
            "btc_price": pnl_entry.get("btc_price", 0),
            "confidence": pnl_entry.get("confidence", 0),
            "divergence_pct": pnl_entry.get("divergence_pct", 0),
            "signal": pnl_entry.get("signal", ""),
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "title": entry.get("title") or result.get("title", ""),
            "version": pnl_entry.get("version", source),
            "pnl_source": "no_redeem_loss",
        }
        
        new_outcomes.append(outcome_record)
    
    # Write new outcomes
    if new_outcomes:
        with open(OUTCOMES_FILE, "a") as f:
            for outcome in new_outcomes:
                f.write(json.dumps(outcome) + "\n")
        print(f"\nRecorded {len(new_outcomes)} outcomes: {wins} wins, {losses} losses")
    
    return new_outcomes


def generate_summary():
    """Generate daily P&L summary from all outcomes."""
    outcomes = load_all_outcomes()
    if not outcomes:
        print("No outcomes to summarize.")
        return None
    
    # Group by date
    by_date = {}
    for o in outcomes:
        t = o.get("time", o.get("checked_at", ""))
        if not t:
            continue
        day = t[:10]  # YYYY-MM-DD
        by_date.setdefault(day, []).append(o)
    
    print("\n" + "=" * 60)
    print("📊 DAILY P&L SUMMARY")
    print("=" * 60)
    
    total_pnl = 0
    total_trades = 0
    total_wins = 0
    
    summaries = []
    
    for day in sorted(by_date.keys()):
        trades = by_date[day]
        wins = sum(1 for t in trades if t.get("win") is True)
        losses = sum(1 for t in trades if t.get("win") is False)
        unknown = sum(1 for t in trades if t.get("win") is None)
        day_pnl = sum(t.get("net_pnl", 0) for t in trades)
        day_exposure = sum(t.get("amount", 0) for t in trades)
        win_rate = (wins / (wins + losses) * 100) if (wins + losses) > 0 else 0
        
        print(f"\n{day}: {len(trades)} trades | {wins}W-{losses}L ({win_rate:.0f}%) | "
              f"P&L: ${day_pnl:+.2f} | Exposure: ${day_exposure:.2f}")
        
        total_pnl += day_pnl
        total_trades += len(trades)
        total_wins += wins
        
        summary = {
            "date": day,
            "trades": len(trades),
            "wins": wins,
            "losses": losses,
            "unknown": unknown,
            "win_rate": round(win_rate, 1),
            "pnl": round(day_pnl, 2),
            "exposure": round(day_exposure, 2),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        summaries.append(summary)
    
    total_losses = total_trades - total_wins
    overall_wr = (total_wins / total_trades * 100) if total_trades > 0 else 0
    
    print(f"\n{'─' * 60}")
    print(f"TOTAL: {total_trades} trades | {total_wins}W-{total_losses}L ({overall_wr:.0f}%) | "
          f"P&L: ${total_pnl:+.2f}")
    print(f"{'─' * 60}")
    
    # Write summaries
    if summaries:
        with open(SUMMARY_FILE, "w") as f:
            for s in summaries:
                f.write(json.dumps(s) + "\n")
    
    return {
        "total_trades": total_trades,
        "wins": total_wins,
        "losses": total_losses,
        "win_rate": round(overall_wr, 1),
        "total_pnl": round(total_pnl, 2),
    }


LAST_NOTIFY_FILE = SKILL_DIR / ".trade_notification_state"


def write_notification(summary, new_outcomes=None):
    """Write notification ONLY when there are new outcomes since last notification.

    Tracks last notified trade count in .trade_notification_state to avoid
    spamming the same stale summary on every run.
    """
    if not summary:
        return

    new_count = len(new_outcomes) if new_outcomes else 0
    if new_count == 0:
        # No new outcomes this run — don't overwrite existing notification
        return

    try:
        data = {
            "time": datetime.now(timezone.utc).isoformat(),
            "type": "pnl_summary",
            "total_trades": summary["total_trades"],
            "wins": summary["wins"],
            "losses": summary["losses"],
            "win_rate": summary["win_rate"],
            "total_pnl": summary["total_pnl"],
            "new_outcomes": new_count,
        }
        with open(NOTIFY_FILE, "w") as f:
            json.dump(data, f)
        # Record state so next run knows what was last notified
        with open(LAST_NOTIFY_FILE, "w") as f:
            json.dump({"total_trades": summary["total_trades"], "time": data["time"]}, f)
    except Exception:
        pass


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Check Polymarket fast market trade outcomes")
    parser.add_argument("--summary-only", action="store_true", help="Only show summary, don't check new")
    parser.add_argument("--notify", action="store_true", help="Write notification file with summary")
    args = parser.parse_args()

    new_outcomes_found = []
    if not args.summary_only:
        result = check_resolutions()
        if result:
            new_outcomes_found = result

    summary = generate_summary()

    if args.notify and summary:
        write_notification(summary, new_outcomes=new_outcomes_found)
