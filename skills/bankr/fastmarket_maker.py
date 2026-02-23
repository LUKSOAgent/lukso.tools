#!/usr/bin/env python3
"""
Polymarket BTC 5-Minute Fast Market Trader v11 — T-10s Taker Strategy

Strategy (v11):
- Wait until T-290s (10s before window close) when direction is ~90% determined
- Place GTC limit order at best_ask (crosses spread = taker fill)
- 290s of momentum data → higher win rate justifies taker fee
- 8s fill timeout then cancel (FOK had precision issues with Polymarket API)

Rationale:
- Maker orders at T-10s never fill: no rational seller at 0.93 when market resolves in 15s
- Fix: buy at best_ask (taker) for guaranteed fill
- Edge vs v10: 290s of confirmed momentum vs 60s → higher directional confidence
- Taker fee ~1-1.5% is offset by improved signal accuracy at T-10s

Requirements:
- py-clob-client, requests
- Polygon wallet private key with USDC on Polymarket
"""

import os
import sys
import json
import time
import signal
import logging
import requests
from datetime import datetime, timezone, date
from pathlib import Path
from typing import Optional, Tuple
from collections import deque

from py_clob_client.client import ClobClient
from py_clob_client.clob_types import ApiCreds, OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY

# ─── Paths ───────────────────────────────────────────────────────────────────
SKILL_DIR = Path(__file__).parent
LOG_FILE  = SKILL_DIR / "fastmarket_clob.log"   # shared log with v10 for continuity
STATE_FILE = SKILL_DIR / "fastmarket_maker_state.json"
PNL_FILE   = SKILL_DIR / "fastmarket_pnl.jsonl"  # shared P&L file
NOTIFY_FILE = SKILL_DIR / ".trade_notification"

sys.stdout.reconfigure(line_buffering=True)

# ─── Config ──────────────────────────────────────────────────────────────────
DEFAULTS = {
    # Position sizing
    "trade_amount": 15,
    "min_trade": 8,
    "max_trade": 20,
    "max_daily_trades": 30,
    "max_daily_loss": 50,

    # Signal thresholds at T-10s (lower = more reliable with 290s data)
    "min_momentum_pct": 0.10,       # 0.10% is meaningful at T-290s
    "strong_momentum_pct": 0.20,    # strong signal → max position size

    # Maker price logic
    "maker_price_premium": 0.01,    # post at best_bid + this
    "maker_price_max": 0.95,        # never pay more than this (need $0.05 edge)
    "maker_price_min": 0.88,        # need at least $0.12 upside to enter
    "fill_timeout": 8,              # seconds to wait for fill before cancel (market resolves soon)

    # Timing
    "fast_poll_start": 270,         # switch to fast polling at T+270s (30s before close)
    "trade_entry_start": 285,       # earliest entry (T+285s = 15s before close)
    "trade_entry_end": 295,         # latest entry (T+295s = 5s before close)
    "poll_interval_normal": 10,     # normal polling interval
    "poll_interval_fast": 2,        # fast polling in final 30s

    # Volatility filter
    "min_hourly_vol": 0.01,         # lower threshold at T-10s (we need some movement)
    "vol_lookback": 360,

    # Price sources
    "chainlink_rpc_urls": [
        "https://polygon-rpc.com",
        "https://rpc.ankr.com/polygon",
        "https://polygon.publicnode.com",
    ],
    "chainlink_btc_feed": "0xc907E116054Ad103354f2D350FD2514433D57F6f",

    # CLOB
    "clob_host": "https://clob.polymarket.com",
    "chain_id": 137,
}

WINDOW_SECONDS = 300

# ─── Credentials ─────────────────────────────────────────────────────────────
WALLET_KEY = os.environ.get(
    "POLYMARKET_PRIVATE_KEY",
    "0x2872aa63a40eaada948450675108834b4ae16f1c84fe74f02b5769cad5357adc"
)

CLOB_CREDS = ApiCreds(
    api_key="654e497b-4be6-d408-9172-f32a3fe546ea",
    api_secret="c6mBg9rnxtDYByW4yXVK1u-zc0ad1QvkwG13urN_qYA=",
    api_passphrase="c90a9bc4ea77d5f1c67e66ce812cc95d395b5d233f615a8423b67a3871bdf811"
)

# ─── Logging ─────────────────────────────────────────────────────────────────
def setup_logging():
    logger = logging.getLogger("fastmarket_maker")
    logger.handlers.clear()
    logger.setLevel(logging.DEBUG)
    logger.propagate = False
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    logger.addHandler(fh)
    return logger

log = setup_logging()

# ─── CLOB Client ─────────────────────────────────────────────────────────────
def create_clob_client(cfg: dict) -> ClobClient:
    return ClobClient(
        cfg["clob_host"],
        key=WALLET_KEY,
        chain_id=cfg["chain_id"],
        creds=CLOB_CREDS,
    )

# ─── Price Sources ───────────────────────────────────────────────────────────
def get_multi_cex_price() -> Optional[float]:
    """BTC/USD median from Coinbase + Binance + Kraken. Requires >= 2 sources."""
    prices = []
    try:
        r = requests.get("https://api.coinbase.com/v2/exchange-rates",
                         params={"currency": "BTC"}, timeout=4)
        r.raise_for_status()
        prices.append(float(r.json()["data"]["rates"]["USDT"]))
    except Exception:
        pass
    try:
        r = requests.get("https://api.binance.com/api/v3/ticker/price",
                         params={"symbol": "BTCUSDT"}, timeout=4)
        r.raise_for_status()
        prices.append(float(r.json()["price"]))
    except Exception:
        pass
    try:
        r = requests.get("https://api.kraken.com/0/public/Ticker",
                         params={"pair": "XBTUSD"}, timeout=4)
        r.raise_for_status()
        result = r.json().get("result", {})
        if result:
            pair_data = next(iter(result.values()))
            prices.append(float(pair_data["c"][0]))
    except Exception:
        pass
    if len(prices) < 2:
        return prices[0] if prices else None
    prices.sort()
    n = len(prices)
    return prices[n // 2] if n % 2 else (prices[n // 2 - 1] + prices[n // 2]) / 2

# ─── Market Discovery ────────────────────────────────────────────────────────
def current_window() -> Tuple[int, int]:
    now = int(time.time())
    start = (now // WINDOW_SECONDS) * WINDOW_SECONDS
    return start, start + WINDOW_SECONDS

def get_market_tokens(ws: int) -> Optional[dict]:
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
        token_ids = json.loads(m.get("clobTokenIds", "[]"))
        if len(token_ids) < 2:
            return None
        return {
            "condition_id": m.get("conditionId"),
            "token_up": token_ids[0],
            "token_down": token_ids[1],
            "neg_risk": m.get("negRisk", False),
            "title": ev.get("title", slug),
        }
    except Exception as e:
        log.error("Market discovery failed for %s: %s", slug, e)
        return None

# ─── Signal Engine (T-10s) ───────────────────────────────────────────────────
def compute_signal_at_t290(
    opening_price: float,
    current_price: float,
    window_prices: deque,
    hourly_prices: deque,
    cfg: dict,
) -> Tuple[Optional[str], float, str]:
    """
    At T-290s, compute direction with 290s of momentum data.
    Lower threshold than early-window strategy (0.10% vs 0.18%).
    Returns: (direction, confidence, reason)
    """
    if opening_price <= 0 or current_price <= 0:
        return None, 0.0, "invalid prices"

    # Volatility filter
    if len(hourly_prices) >= 10:
        prices = list(hourly_prices)
        returns = [((prices[i] - prices[i-1]) / prices[i-1]) * 100
                   for i in range(1, len(prices)) if prices[i-1] > 0]
        if returns:
            mean_r = sum(returns) / len(returns)
            vol = (sum((r - mean_r) ** 2 for r in returns) / len(returns)) ** 0.5
            if vol < cfg["min_hourly_vol"]:
                return None, 0.0, f"vol={vol:.4f}% too low — dead market"

    momentum_pct = ((current_price - opening_price) / opening_price) * 100
    abs_mom = abs(momentum_pct)
    direction = "UP" if momentum_pct > 0 else "DOWN"

    min_mom = cfg["min_momentum_pct"]       # 0.10%
    strong_mom = cfg["strong_momentum_pct"] # 0.20%

    if abs_mom < min_mom:
        return None, 0.0, f"mom={momentum_pct:+.3f}% below threshold ({min_mom}%)"

    # Confidence: scales from 0.5 at min_mom to 1.0 at strong_mom
    if abs_mom >= strong_mom:
        confidence = min(1.0, 0.7 + (abs_mom - strong_mom) / strong_mom * 0.3)
        tier = "strong"
    else:
        confidence = 0.5 + (abs_mom - min_mom) / (strong_mom - min_mom) * 0.2
        tier = "moderate"

    reason = (f"t290 {tier} | mom={momentum_pct:+.3f}% → {direction} "
              f"| conf={confidence:.2f} | open=${opening_price:.2f} now=${current_price:.2f}")
    return direction, confidence, reason

# ─── Maker Price ─────────────────────────────────────────────────────────────
def get_taker_price(client, token_id: str, cfg: dict) -> Optional[float]:
    """
    Get best_ask and buy at that price (taker — crosses the spread).
    At T-10s there are no natural sellers on the winning side at maker prices,
    so we cross the spread to guarantee a fill.
    Returns price to use, or None if market is out of range.
    """
    try:
        book = client.get_order_book(token_id)

        # Get best ask (lowest sell price in book)
        asks = getattr(book, 'asks', None) or []
        if asks:
            if hasattr(asks[0], 'price'):
                best_ask = min(float(a.price) for a in asks)
            else:
                best_ask = min(float(a.get("price", 0)) for a in asks if float(a.get("price", 0)) > 0)
        else:
            best_ask = cfg["maker_price_max"]  # fallback

        # Clamp to valid range
        our_price = max(cfg["maker_price_min"], min(cfg["maker_price_max"], round(best_ask, 2)))

        log.info("Orderbook: best_ask=%.2f → taker_price=%.2f", best_ask, our_price)
        return our_price

    except Exception as e:
        log.warning("Orderbook failed: %s — using fallback %.2f", e, cfg["maker_price_min"])
        return cfg["maker_price_min"]

# ─── Order Management ────────────────────────────────────────────────────────
def place_maker_order(client, token_id: str, amount: float, price: float) -> Tuple[bool, str, Optional[str]]:
    """Place GTC limit order at best_ask (crosses spread = taker fill, 8s cancel timeout). Returns (success, description, order_id)."""
    try:
        size = round(amount / price, 2)
        price_rounded = round(price, 2)

        if price_rounded < 0.01 or price_rounded > 0.99:
            return False, f"Invalid price: {price_rounded}", None

        log.info("📝 TAKER BUY %s shares @ $%.2f (=$%.2f)", size, price_rounded, amount)

        order_args = OrderArgs(
            price=price_rounded,
            size=size,
            side=BUY,
            token_id=token_id,
        )
        signed_order = client.create_order(order_args)
        result = client.post_order(signed_order, OrderType.GTC)  # GTC at best_ask = immediate taker fill

        log.info("📬 Response: %s", json.dumps(result)[:500] if isinstance(result, dict) else str(result)[:500])

        if isinstance(result, dict):
            order_id = result.get("orderID") or result.get("order_id") or result.get("id")
            if result.get("success") or order_id:
                return True, f"{size} shares @ ${price_rounded}", order_id
            error = result.get("error", result.get("message", "Unknown"))
            return False, f"Rejected: {error}", None

        return True, f"Submitted: {str(result)[:200]}", None

    except Exception as e:
        log.error("Order error: %s", e)
        return False, str(e), None


def wait_for_fill(client, order_id: str, timeout_sec: int) -> Tuple[bool, float]:
    """
    Poll order status until filled or timeout.
    Returns (filled, fill_pct).
    Market resolves soon — don't wait longer than timeout.
    """
    if not order_id:
        return True, 100.0

    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            order = client.get_order(order_id)
            if isinstance(order, dict):
                status = order.get("status", "").lower()
                size_matched = float(order.get("size_matched", 0))
                original_size = float(order.get("original_size", 1))
                fill_pct = (size_matched / original_size * 100) if original_size > 0 else 0

                if status in ("matched", "filled") or fill_pct >= 95:
                    log.info("✅ Filled (%.0f%%)", fill_pct)
                    return True, fill_pct
                elif status in ("cancelled", "expired"):
                    log.warning("Order cancelled/expired")
                    return False, fill_pct
                # Still live — keep waiting
        except Exception as e:
            log.debug("Fill check error: %s", e)
        time.sleep(1)

    return False, 0.0


def cancel_order(client, order_id: str):
    """Cancel order — called when fill_timeout expires before market close."""
    try:
        client.cancel(order_id)
        log.info("🗑️ Cancelled order %s", order_id[:16])
    except Exception as e:
        log.warning("Cancel failed for %s: %s", order_id[:16], e)

# ─── Position Sizing ─────────────────────────────────────────────────────────
def calc_trade_size(confidence: float, cfg: dict) -> float:
    base = cfg["trade_amount"]
    scaled = base * (0.5 + confidence * 0.8)  # 0.5 conf → $9, 0.8 conf → $15, 1.0 conf → $19
    return max(cfg["min_trade"], min(cfg["max_trade"], round(scaled, 2)))

# ─── P&L / State / Notifications ─────────────────────────────────────────────
class DailyTracker:
    def __init__(self):
        self.today = ""
        self.trades = []
        self.exposure = 0.0

    def _check_day(self):
        today = date.today().isoformat()
        if today != self.today:
            if self.today and self.trades:
                log.info("Day %s closed: %d trades, $%.2f exposure",
                         self.today, len(self.trades), self.exposure)
            self.today = today
            self.trades = []
            self.exposure = 0.0

    def record(self, direction, amount, filled, ws, price, confidence, signal_reason, fill_pct=0):
        self._check_day()
        entry = {
            "time": datetime.now(timezone.utc).isoformat(),
            "direction": direction,
            "amount": amount,
            "filled": filled,
            "fill_pct": round(fill_pct, 1),
            "window": ws,
            "btc_price": round(price, 2),
            "confidence": round(confidence, 3),
            "signal": signal_reason,
            "version": "v11-maker-t10",
        }
        self.trades.append(entry)
        if filled:
            self.exposure += amount
        try:
            with open(PNL_FILE, "a") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception:
            pass

    @property
    def trade_count(self):
        self._check_day()
        return len(self.trades)

    @property
    def total_exposure(self):
        self._check_day()
        return self.exposure


def save_state(last_trade_window: int, last_trade_time: float):
    try:
        with open(STATE_FILE, "w") as f:
            json.dump({
                "last_trade_window": last_trade_window,
                "last_trade_time": last_trade_time,
                "updated": datetime.now(timezone.utc).isoformat(),
            }, f)
    except Exception:
        pass


def load_state() -> Tuple[int, float]:
    try:
        with open(STATE_FILE) as f:
            data = json.load(f)
        return data.get("last_trade_window", 0), data.get("last_trade_time", 0)
    except Exception:
        return 0, 0.0


def notify_trade(direction, amount, price, confidence, filled, fill_pct,
                 trades_today, exposure, signal_reason, error=""):
    try:
        data = {
            "time": datetime.now(timezone.utc).isoformat(),
            "type": "fastmarket_v11_maker",
            "direction": direction,
            "amount": amount,
            "price": round(price, 2),
            "confidence": round(confidence, 3),
            "filled": filled,
            "fill_pct": round(fill_pct, 1),
            "trades_today": trades_today,
            "exposure_today": round(exposure, 2),
            "signal": signal_reason,
        }
        if error:
            data["error"] = error
        with open(NOTIFY_FILE, "w") as f:
            json.dump(data, f)
    except Exception:
        pass

# ─── Main Loop ───────────────────────────────────────────────────────────────
def main():
    cfg = dict(DEFAULTS)
    config_path = SKILL_DIR / "config.json"
    if config_path.exists():
        try:
            with open(config_path) as f:
                data = json.load(f)
            if "fastmarket_maker" in data:
                cfg.update(data["fastmarket_maker"])
                log.info("Loaded fastmarket_maker config overrides")
            elif "fastmarket" in data:
                # Fall back to shared fastmarket config
                shared = data["fastmarket"]
                for k in ("trade_amount", "min_trade", "max_trade",
                          "max_daily_trades", "max_daily_loss"):
                    if k in shared:
                        cfg[k] = shared[k]
                log.info("Loaded fastmarket config (shared keys)")
        except Exception as e:
            log.warning("Config load failed: %s", e)

    log.info("=" * 60)
    log.info("⚡ Polymarket BTC 5-Min Trader v11 — T-10s Taker Strategy (GTC @ best_ask)")
    log.info("=" * 60)
    log.info("Entry: T+%d to T+%ds | Maker price: %.2f-%.2f | Timeout: %ds",
             cfg["trade_entry_start"], cfg["trade_entry_end"],
             cfg["maker_price_min"], cfg["maker_price_max"], cfg["fill_timeout"])
    log.info("Signal threshold: %.2f%% (strong: %.2f%%)",
             cfg["min_momentum_pct"], cfg["strong_momentum_pct"])
    log.info("Position: $%d base ($%d-$%d) | Daily cap: %d trades / $%d",
             cfg["trade_amount"], cfg["min_trade"], cfg["max_trade"],
             cfg["max_daily_trades"], cfg["max_daily_loss"])
    log.info("=" * 60)

    try:
        client = create_clob_client(cfg)
        addr = client.get_address()
        log.info("Wallet: %s", addr)
        ok = client.get_ok()
        log.info("CLOB API: %s", ok)
    except Exception as e:
        log.error("CLOB init failed: %s", e)
        sys.exit(1)

    tracker = DailyTracker()
    last_trade_window, last_trade_time = load_state()

    window_prices = deque(maxlen=60)       # ~2 windows at 10s intervals
    hourly_prices = deque(maxlen=cfg["vol_lookback"])
    current_window_start = 0
    window_opening_price = None
    window_market_info = None
    in_fast_poll = False
    trade_attempted_this_window = False

    while True:
        try:
            now = time.time()
            ws, we = current_window()
            elapsed = now - ws
            remaining = we - now

            # ── New window ──
            if ws != current_window_start:
                if current_window_start > 0 and window_prices:
                    log.info("── Window %d done | %d samples | $%.2f → $%.2f ──",
                             current_window_start, len(window_prices),
                             window_prices[0], window_prices[-1])
                current_window_start = ws
                window_prices.clear()
                window_opening_price = None
                window_market_info = None
                in_fast_poll = False
                trade_attempted_this_window = False
                log.info("══ NEW WINDOW %d (%s UTC) ══",
                         ws, datetime.fromtimestamp(ws, tz=timezone.utc).strftime("%H:%M"))

            # ── Fetch price ──
            price = get_multi_cex_price()
            if not price or price <= 0:
                log.warning("Price fetch failed, retry")
                time.sleep(cfg["poll_interval_fast"] if in_fast_poll else cfg["poll_interval_normal"])
                continue

            window_prices.append(price)
            hourly_prices.append(price)

            if window_opening_price is None:
                window_opening_price = price
                log.info("Opening: $%.2f", price)

            # ── Daily limits ──
            if tracker.trade_count >= cfg["max_daily_trades"]:
                if not hasattr(main, '_daily_limit_logged'):
                    log.info("Daily trade limit (%d). Waiting.", tracker.trade_count)
                    main._daily_limit_logged = True
                time.sleep(WINDOW_SECONDS)
                continue
            main._daily_limit_logged = False

            if tracker.total_exposure >= cfg["max_daily_loss"]:
                log.info("Daily loss cap ($%.2f). Waiting.", tracker.total_exposure)
                time.sleep(WINDOW_SECONDS)
                continue

            # ── Already traded this window ──
            if ws == last_trade_window or trade_attempted_this_window:
                poll_interval = cfg["poll_interval_fast"] if elapsed >= cfg["fast_poll_start"] else cfg["poll_interval_normal"]
                time.sleep(poll_interval)
                continue

            # ── Switch to fast poll at T+270s ──
            if elapsed >= cfg["fast_poll_start"] and not in_fast_poll:
                in_fast_poll = True
                log.info("🔄 Switching to fast poll (T+%.0fs, %.0fs remaining)", elapsed, remaining)

            # ── Not yet in trade entry window — just collect data ──
            if elapsed < cfg["trade_entry_start"]:
                poll_interval = cfg["poll_interval_fast"] if in_fast_poll else cfg["poll_interval_normal"]
                if len(window_prices) % 6 == 0:
                    log.debug("T+%.0fs | BTC=$%.2f | samples=%d | remaining=%.0fs",
                              elapsed, price, len(window_prices), remaining)
                time.sleep(poll_interval)
                continue

            # ── Past entry window — too late ──
            if elapsed > cfg["trade_entry_end"]:
                # Skip to next window
                sleep_time = max(1, remaining + 2)
                log.debug("Past entry window (T+%.0fs), sleeping %.0fs to next window", elapsed, sleep_time)
                time.sleep(sleep_time)
                continue

            # ── TRADE ENTRY WINDOW: T+285 to T+295 ──
            log.info("🎯 ENTRY WINDOW: T+%.0fs | BTC=$%.2f | samples=%d",
                     elapsed, price, len(window_prices))

            # Compute signal
            direction, confidence, reason = compute_signal_at_t290(
                window_opening_price, price, window_prices, hourly_prices, cfg
            )

            if not direction:
                log.info("📊 HOLD | %s", reason)
                trade_attempted_this_window = True  # don't retry in same window
                last_trade_window = ws
                save_state(last_trade_window, last_trade_time)
                time.sleep(cfg["poll_interval_fast"])
                continue

            trade_size = calc_trade_size(confidence, cfg)
            log.info("🚀 SIGNAL: %s $%.0f | %s", direction, trade_size, reason)

            # Discover market
            if window_market_info is None:
                window_market_info = get_market_tokens(ws)

            if window_market_info is None:
                log.error("❌ No market for window %d", ws)
                trade_attempted_this_window = True
                last_trade_window = ws
                save_state(last_trade_window, last_trade_time)
                time.sleep(cfg["poll_interval_fast"])
                continue

            token_id = (window_market_info["token_up"] if direction == "UP"
                        else window_market_info["token_down"])
            log.info("Market: %s | Token: %s... | Side: %s",
                     window_market_info["title"], token_id[:20], direction)

            # Get taker price (best_ask — crosses spread for guaranteed fill)
            maker_price = get_taker_price(client, token_id, cfg)
            if maker_price is None:
                log.warning("Could not determine taker price, skipping")
                trade_attempted_this_window = True
                last_trade_window = ws
                save_state(last_trade_window, last_trade_time)
                continue

            # Place FOK taker order
            success, output, order_id = place_maker_order(
                client, token_id, trade_size, maker_price
            )

            trade_attempted_this_window = True
            last_trade_window = ws
            last_trade_time = time.time()
            save_state(last_trade_window, last_trade_time)

            if not success:
                log.error("❌ Order failed: %s", output)
                tracker.record(direction, trade_size, False, ws, price, confidence, reason)
                notify_trade(direction, trade_size, price, confidence, False, 0,
                             tracker.trade_count, tracker.total_exposure, reason, output)
                time.sleep(cfg["poll_interval_fast"])
                continue

            log.info("📬 Order posted: %s — waiting up to %ds for fill",
                     output, cfg["fill_timeout"])

            # Wait for fill (market resolves in ~5-15s)
            filled, fill_pct = wait_for_fill(client, order_id, cfg["fill_timeout"])

            if not filled and order_id:
                # Cancel unfilled order before market resolves against us
                cancel_order(client, order_id)

            tracker.record(direction, trade_size, filled, ws, price, confidence, reason, fill_pct)

            if filled:
                log.info("✅ FILLED: %s $%.0f @ $%.2f (%.0f%%)",
                         direction, trade_size, maker_price, fill_pct)
            elif fill_pct > 0:
                log.warning("⚠️ PARTIAL: %s $%.0f @ $%.2f (%.0f%% filled, cancelled rest)",
                            direction, trade_size, maker_price, fill_pct)
            else:
                log.warning("⚠️ UNFILLED: %s $%.0f @ $%.2f — cancelled (no takers)",
                            direction, trade_size, maker_price)

            notify_trade(direction, trade_size, price, confidence, filled, fill_pct,
                         tracker.trade_count, tracker.total_exposure, reason,
                         "" if filled else "unfilled/partial")

            time.sleep(cfg["poll_interval_fast"])

        except KeyboardInterrupt:
            raise
        except Exception as e:
            log.exception("Main loop error: %s", e)
            time.sleep(30)


if __name__ == "__main__":
    def _sigterm(sig, frame):
        log.info("SIGTERM — shutting down")
        sys.exit(0)

    signal.signal(signal.SIGTERM, _sigterm)

    try:
        main()
    except KeyboardInterrupt:
        log.info("Stopped by user")
        sys.exit(0)
