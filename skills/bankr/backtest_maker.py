#!/usr/bin/env python3
"""
Backtest: T-10s Maker Strategy for Polymarket BTC 5-min markets

Method:
- Fetch Binance 1m BTCUSDT klines for past N hours
- For each 5-min window: compute opening price + price at T-290s
- Apply momentum signal (>0.10% threshold)
- Check actual resolution (BTC up or down vs window open at T-300s)
- Simulate P&L assuming maker fill at 0.92 (conservative) when signal fires
- Track: win rate, fill assumption, P&L at different entry prices

No Polymarket orderbook data needed — we assume maker fills at 0.90/0.92/0.95
and test whether direction signal is correct.
"""

import requests
import json
import time
import sys
from datetime import datetime, timezone, timedelta
from typing import Optional

WINDOW_SECONDS = 300
TRADE_AMOUNT = 15.0
MIN_MOMENTUM = 0.10   # % threshold at T-290s

def get_binance_klines(symbol: str, interval: str, start_ms: int, end_ms: int) -> list:
    """Fetch Binance klines. Returns list of [open_time, open, high, low, close, ...]."""
    url = "https://api.binance.com/api/v3/klines"
    all_klines = []
    current_start = start_ms

    while current_start < end_ms:
        params = {
            "symbol": symbol,
            "interval": interval,
            "startTime": current_start,
            "endTime": end_ms,
            "limit": 1000,
        }
        try:
            resp = requests.get(url, params=params, timeout=10)
            resp.raise_for_status()
            klines = resp.json()
            if not klines:
                break
            all_klines.extend(klines)
            current_start = klines[-1][0] + 60000  # next minute
            if len(klines) < 1000:
                break
            time.sleep(0.1)  # rate limit
        except Exception as e:
            print(f"Kline fetch error: {e}")
            break

    return all_klines


def build_price_map(klines: list) -> dict:
    """Build {minute_timestamp_sec: close_price} map from klines."""
    price_map = {}
    for k in klines:
        open_time_sec = k[0] // 1000
        close_price = float(k[4])
        price_map[open_time_sec] = close_price
    return price_map


def get_price_at(price_map: dict, target_sec: int, tolerance: int = 90) -> Optional[float]:
    """Get closest price within tolerance seconds."""
    # Try exact match first, then nearest minute
    for delta in range(0, tolerance, 60):
        for sign in [0, -1, 1]:
            t = target_sec + sign * delta
            # Round to nearest minute
            t_min = (t // 60) * 60
            if t_min in price_map:
                return price_map[t_min]
    return None


def get_market_outcome(ws: int) -> Optional[str]:
    """
    Get actual market resolution for a window.
    Returns 'UP', 'DOWN', or None if not resolved/not found.
    """
    slug = f"btc-updown-5m-{ws}"
    try:
        resp = requests.get(
            f"https://gamma-api.polymarket.com/events?slug={slug}",
            timeout=10,
        )
        data = resp.json()
        if not data:
            return None
        ev = data[0]
        mkts = ev.get("markets", [])
        if not mkts:
            return None
        m = mkts[0]

        # outcomePrices: ["1", "0"] = YES won (UP), ["0", "1"] = NO won (DOWN)
        # This is set even when resolved field is None/False
        outcome_prices = m.get("outcomePrices")
        if outcome_prices:
            try:
                prices = json.loads(outcome_prices) if isinstance(outcome_prices, str) else outcome_prices
                yes_price = float(prices[0])
                no_price = float(prices[1])
                # Only use if one side is clearly resolved (price = 1.0 or 0.0)
                if yes_price >= 0.99:
                    return "UP"
                elif no_price >= 0.99:
                    return "DOWN"
                # Market not yet resolved (prices still between 0 and 1)
                return None
            except Exception:
                pass

        # Fallback: winner_outcome field
        winner = m.get("winner_outcome") or m.get("winnerOutcome")
        if winner:
            return "UP" if winner.upper() == "YES" else "DOWN"

        return None
    except Exception as e:
        return None


def simulate_trade(direction: str, outcome: str, entry_price: float, amount: float) -> dict:
    """
    Simulate a maker trade.
    - If direction == outcome: win → payout = amount / entry_price * 1.0 - amount
    - If direction != outcome: loss → -amount (shares worth 0)
    - Maker: no taker fee, assume rebate ~0.1% of notional (simplified)
    """
    shares = amount / entry_price
    if direction == outcome:
        gross_payout = shares * 1.0  # each share pays $1
        profit = gross_payout - amount
        rebate = amount * 0.001  # ~0.1% rebate estimate (conservative)
        net_pnl = profit + rebate
        return {"result": "WIN", "pnl": round(net_pnl, 4), "shares": round(shares, 2)}
    else:
        loss = -amount
        return {"result": "LOSS", "pnl": round(loss, 4), "shares": round(shares, 2)}


def run_backtest(hours_back: int = 48, entry_price: float = 0.92):
    now_sec = int(time.time())
    start_sec = now_sec - hours_back * 3600

    print(f"Backtest: T-10s Maker Strategy")
    print(f"Period: last {hours_back}h | Entry price: ${entry_price} | Signal: >{MIN_MOMENTUM}% momentum")
    print(f"Fetching Binance 1m klines ({hours_back}h)...")

    start_ms = start_sec * 1000
    end_ms = now_sec * 1000
    klines = get_binance_klines("BTCUSDT", "1m", start_ms, end_ms)
    print(f"Got {len(klines)} 1-minute candles")

    if len(klines) < 10:
        print("ERROR: Insufficient kline data")
        sys.exit(1)

    price_map = build_price_map(klines)
    print(f"Price map: {len(price_map)} minutes ({list(price_map.keys())[0]} → {list(price_map.keys())[-1]})")

    # Enumerate all 5-min windows in the period
    first_window = (start_sec // WINDOW_SECONDS) * WINDOW_SECONDS
    last_window = ((now_sec - WINDOW_SECONDS) // WINDOW_SECONDS) * WINDOW_SECONDS
    windows = list(range(first_window, last_window + 1, WINDOW_SECONDS))
    print(f"\nAnalyzing {len(windows)} windows...")

    results = []
    skipped_no_price = 0
    skipped_no_outcome = 0
    skipped_no_signal = 0
    traded = 0

    for ws in windows:
        we = ws + WINDOW_SECONDS

        # Skip very recent windows (not resolved yet)
        if we > now_sec - 600:
            continue

        # Price at window open (T+0)
        open_price = get_price_at(price_map, ws)
        if not open_price:
            skipped_no_price += 1
            continue

        # Price at T+290s (10s before close)
        t290_price = get_price_at(price_map, ws + 290)
        if not t290_price:
            # Try at T+240s (4-min mark, nearest available 1m candle)
            t290_price = get_price_at(price_map, ws + 240)
        if not t290_price:
            skipped_no_price += 1
            continue

        # Signal
        momentum_pct = ((t290_price - open_price) / open_price) * 100
        if abs(momentum_pct) < MIN_MOMENTUM:
            skipped_no_signal += 1
            continue

        direction = "UP" if momentum_pct > 0 else "DOWN"

        # Get actual outcome from Polymarket
        outcome = get_market_outcome(ws)
        if outcome is None:
            skipped_no_outcome += 1
            time.sleep(0.2)  # rate limit
            continue

        time.sleep(0.1)  # rate limit Polymarket API

        # Simulate trade
        sim = simulate_trade(direction, outcome, entry_price, TRADE_AMOUNT)
        traded += 1

        dt = datetime.fromtimestamp(ws, tz=timezone.utc).strftime("%Y-%m-%d %H:%M")
        results.append({
            "window": ws,
            "datetime": dt,
            "open": round(open_price, 2),
            "t290": round(t290_price, 2),
            "momentum_pct": round(momentum_pct, 4),
            "signal": direction,
            "outcome": outcome,
            "correct": direction == outcome,
            "pnl": sim["pnl"],
            "result": sim["result"],
            "shares": sim["shares"],
        })

        status = "✅" if direction == outcome else "❌"
        print(f"  {dt} | mom={momentum_pct:+.3f}% → {direction} | outcome={outcome} | "
              f"{status} | P&L=${sim['pnl']:+.2f}")

    # ── Summary ──────────────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"BACKTEST RESULTS — T-10s Maker @ ${entry_price}")
    print(f"{'='*60}")
    print(f"Windows analyzed: {len(windows)}")
    print(f"  No price data:   {skipped_no_price}")
    print(f"  No signal:       {skipped_no_signal} (|momentum| < {MIN_MOMENTUM}%)")
    print(f"  No outcome:      {skipped_no_outcome}")
    print(f"  Traded:          {traded}")

    if not results:
        print("No tradeable results found.")
        return

    wins = [r for r in results if r["correct"]]
    losses = [r for r in results if not r["correct"]]
    total_pnl = sum(r["pnl"] for r in results)
    win_rate = len(wins) / len(results) * 100 if results else 0

    print(f"\nWin rate: {len(wins)}/{len(results)} = {win_rate:.1f}%")
    print(f"Total P&L: ${total_pnl:+.2f}")
    print(f"Avg P&L/trade: ${total_pnl/len(results):+.2f}")

    # Breakeven analysis at different entry prices
    print(f"\nBreakeven analysis (need win_rate > entry_price to profit):")
    for ep in [0.88, 0.90, 0.92, 0.95]:
        be_rate = ep * 100
        hypothetical_pnl = sum(
            simulate_trade(r["signal"], r["outcome"], ep, TRADE_AMOUNT)["pnl"]
            for r in results
        )
        print(f"  @ ${ep}: breakeven={be_rate:.0f}% | hypothetical P&L=${hypothetical_pnl:+.2f}")

    # Signal strength breakdown
    strong = [r for r in results if abs(r["momentum_pct"]) >= 0.20]
    moderate = [r for r in results if 0.10 <= abs(r["momentum_pct"]) < 0.20]

    if strong:
        strong_win = sum(1 for r in strong if r["correct"])
        print(f"\nStrong signal (>=0.20%): {strong_win}/{len(strong)} = {strong_win/len(strong)*100:.1f}% win rate")
    if moderate:
        mod_win = sum(1 for r in moderate if r["correct"])
        print(f"Moderate signal (0.10-0.20%): {mod_win}/{len(moderate)} = {mod_win/len(moderate)*100:.1f}% win rate")

    # Save results
    output_file = "/root/.openclaw/workspace/skills/bankr/backtest_maker_results.json"
    with open(output_file, "w") as f:
        json.dump({
            "params": {"hours_back": hours_back, "entry_price": entry_price, "min_momentum": MIN_MOMENTUM},
            "summary": {
                "total_windows": len(windows),
                "traded": traded,
                "wins": len(wins),
                "losses": len(losses),
                "win_rate_pct": round(win_rate, 2),
                "total_pnl": round(total_pnl, 2),
                "avg_pnl": round(total_pnl / len(results), 2) if results else 0,
            },
            "trades": results,
        }, f, indent=2)
    print(f"\nFull results saved to: {output_file}")


if __name__ == "__main__":
    hours = int(sys.argv[1]) if len(sys.argv) > 1 else 48
    price = float(sys.argv[2]) if len(sys.argv) > 2 else 0.92
    run_backtest(hours_back=hours, entry_price=price)
