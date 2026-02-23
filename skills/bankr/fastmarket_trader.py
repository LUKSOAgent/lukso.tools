#!/usr/bin/env python3
"""
Polymarket BTC 5-Minute Fast Market Trader v3

Strategy:
- Every 5 minutes, a new "BTC Up or Down" market opens on Polymarket
- Resolution source: Chainlink BTC/USD data stream
- Edge: Read Chainlink oracle directly — ~60s ahead of Polymarket terminal
- Trade via Bankr API (natural language → actual CLOB orders)

Market mechanics:
- URL pattern: polymarket.com/event/btc-updown-5m-{unix_timestamp_aligned_to_300}
- Resolves "Up" if BTC price at end >= price at start of 5-min window
- Resolves "Down" otherwise
- Resolution source: Chainlink BTC/USD on data.chain.link/streams/btc-usd

Trading approach:
1. At start of each 5-min window, fetch Chainlink oracle price (this is the "opening" price)
2. Monitor price movement during the first ~3 minutes
3. If strong momentum detected, bet on the direction
4. Only trade in first 3 min of window (need time for order fill)

Key: Chainlink updates every ~60s. Polymarket terminal shows delayed data.
We read the oracle directly for the freshest price.
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

# ─── Paths ───────────────────────────────────────────────────────────────────
SKILL_DIR = Path(__file__).parent
LOG_FILE = SKILL_DIR / "fastmarket_trader.log"
STATE_FILE = SKILL_DIR / "fastmarket_state.json"
PNL_FILE = SKILL_DIR / "fastmarket_pnl.jsonl"
NOTIFY_FILE = SKILL_DIR / ".trade_notification"

# Force line-buffered stdout
sys.stdout.reconfigure(line_buffering=True)

# ─── Config ──────────────────────────────────────────────────────────────────
DEFAULTS = {
    "trade_amount": 5,              # $ per trade — conservative start
    "max_daily_trades": 30,         # 5-min windows = 288/day, we pick best ones
    "max_daily_loss": 50,           # stop if losing too much
    "min_momentum_pct": 0.05,       # 0.05% minimum BTC move to trade
    "min_samples": 3,               # minimum price samples before trading
    "trade_window_sec": 180,        # only trade in first 3 min of window (180s)
    "poll_interval": 15,            # check price every 15s
    "network": "polygon",           # Bankr network for Polymarket
    "cooldown_after_trade": 300,    # 5 min cooldown = skip 1 window after trade
    "chainlink_rpc_urls": [
        "https://polygon-rpc.com",
        "https://rpc.ankr.com/polygon",
        "https://polygon.publicnode.com",
    ],
    "chainlink_btc_feed": "0xc907E116054Ad103354f2D350FD2514433D57F6f",
    "price_fallbacks": ["coinbase", "binance"],
}

WINDOW_SECONDS = 300  # 5 minutes

# ─── Logging ─────────────────────────────────────────────────────────────────
def setup_logging():
    logger = logging.getLogger("fastmarket")
    if logger.handlers:
        return logger  # Already configured
    logger.setLevel(logging.DEBUG)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")

    fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    return logger

log = setup_logging()


# ─── Price Sources ───────────────────────────────────────────────────────────

def get_chainlink_price(feed_addr: str, rpc_urls: list) -> Optional[dict]:
    """Read BTC/USD directly from Chainlink oracle on Polygon.
    Returns: {price, updated_at} or None
    """
    payload = {
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": feed_addr, "data": "0xfeaf968c"}, "latest"],  # latestRoundData()
        "id": 1,
    }

    for rpc in rpc_urls:
        try:
            resp = requests.post(rpc, json=payload, timeout=8,
                                 headers={"User-Agent": "Mozilla/5.0 (OpenClaw)"})
            result = resp.json()
            if result.get("error"):
                continue

            data = result.get("result", "")
            if len(data) < 322:
                continue

            hex_data = data[2:] if data.startswith("0x") else data
            slots = [hex_data[i:i+64] for i in range(0, len(hex_data), 64)]
            if len(slots) < 5:
                continue

            answer = int(slots[1], 16)
            if answer >= 2**255:
                answer -= 2**256
            price = answer / 1e8  # 8 decimals

            updated_at = int(slots[3], 16)

            return {"price": price, "updated_at": updated_at, "source": "chainlink", "rpc": rpc}
        except Exception as e:
            log.debug("Chainlink RPC %s failed: %s", rpc, e)
            continue
    return None


def get_coinbase_price() -> Optional[float]:
    resp = requests.get("https://api.coinbase.com/v2/exchange-rates",
                        params={"currency": "BTC"}, timeout=5)
    resp.raise_for_status()
    return float(resp.json()["data"]["rates"]["USDT"])


def get_binance_price() -> Optional[float]:
    resp = requests.get("https://api.binance.com/api/v3/ticker/price",
                        params={"symbol": "BTCUSDT"}, timeout=5)
    resp.raise_for_status()
    return float(resp.json()["price"])


def get_best_price(cfg: dict) -> Optional[float]:
    """Try Chainlink first (the edge), then fallback to CEX."""
    cl = get_chainlink_price(cfg["chainlink_btc_feed"], cfg["chainlink_rpc_urls"])
    if cl and cl["price"] > 0:
        return cl["price"]

    fallbacks = {"coinbase": get_coinbase_price, "binance": get_binance_price}
    for src in cfg["price_fallbacks"]:
        try:
            p = fallbacks[src]()
            if p and p > 0:
                log.debug("Using fallback price from %s: $%.2f", src, p)
                return p
        except Exception as e:
            log.debug("Fallback %s failed: %s", src, e)
    return None


# ─── Market Discovery ───────────────────────────────────────────────────────

def current_window() -> Tuple[int, int]:
    """Return (window_start_ts, window_end_ts) for the current 5-min market."""
    now = int(time.time())
    start = (now // WINDOW_SECONDS) * WINDOW_SECONDS
    return start, start + WINDOW_SECONDS


def market_slug(window_start: int) -> str:
    """Generate the Polymarket event slug for a 5-min BTC market."""
    return f"btc-updown-5m-{window_start}"


def market_url(window_start: int) -> str:
    return f"https://polymarket.com/event/{market_slug(window_start)}"


def time_into_window() -> float:
    """Seconds elapsed since the current window started."""
    now = time.time()
    start = (int(now) // WINDOW_SECONDS) * WINDOW_SECONDS
    return now - start


# ─── Bankr API Client ────────────────────────────────────────────────────────

def _load_bankr_config() -> dict:
    """Load API key and URL from config.json."""
    config_path = SKILL_DIR / "config.json"
    with open(config_path) as f:
        data = json.load(f)
    return {
        "api_key": data["apiKey"],
        "api_url": data.get("apiUrl", "https://api.bankr.bot"),
    }


def bankr_submit(prompt: str, bk: dict) -> Optional[str]:
    """Submit a prompt to Bankr API, return job_id."""
    resp = requests.post(
        f"{bk['api_url']}/agent/prompt",
        headers={"X-API-Key": bk["api_key"], "Content-Type": "application/json"},
        json={"prompt": prompt},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    return data.get("jobId")


def bankr_poll(job_id: str, bk: dict, max_wait: int = 180) -> Optional[dict]:
    """Poll Bankr until job completes or times out."""
    deadline = time.time() + max_wait
    while time.time() < deadline:
        try:
            resp = requests.get(
                f"{bk['api_url']}/agent/job/{job_id}",
                headers={"X-API-Key": bk["api_key"]},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            status = data.get("status")
            if status == "completed":
                return data
            elif status in ("failed", "cancelled"):
                log.error("Bankr job %s status: %s", job_id, status)
                return data
            # Still processing — wait and retry
            time.sleep(5)
        except Exception as e:
            log.debug("Poll error: %s", e)
            time.sleep(5)
    return None  # Timed out


# ─── Trade Execution via Bankr ───────────────────────────────────────────────

def place_trade(direction: str, amount: int, window_start: int, cfg: dict) -> Tuple[bool, str]:
    """Place a bet on the current 5-min BTC market via Bankr API (async submit+poll)."""
    side = "Up" if direction == "UP" else "Down"
    url = market_url(window_start)

    prompt = (
        f"Buy ${amount} of {side} shares on the Bitcoin Up or Down 5 minute market "
        f"at {url} on Polymarket"
    )

    log.info("🎯 Bankr prompt: %s", prompt)

    try:
        bk = _load_bankr_config()

        # Submit
        job_id = bankr_submit(prompt, bk)
        if not job_id:
            return False, "No job_id returned"
        log.info("Bankr job submitted: %s", job_id)

        # Poll (max 180s)
        result = bankr_poll(job_id, bk, max_wait=180)
        if result is None:
            return False, f"Timeout polling job {job_id}"

        resp_text = result.get("response", "")
        log.info("Bankr response: %s", resp_text[:400])

        lower = resp_text.lower()
        # Positive signals
        if any(w in lower for w in ["placed", "bought", "success", "confirmed", "order", "bet", "purchase"]):
            return True, resp_text[:300]
        # Negative signals
        if any(w in lower for w in ["fail", "error", "insufficient", "rejected", "cannot", "unable", "no market"]):
            return False, resp_text[:300]
        # Job completed but ambiguous — check status
        if result.get("status") == "completed":
            return True, resp_text[:300]
        return False, resp_text[:300]

    except requests.HTTPError as e:
        log.error("Bankr HTTP error: %s", e)
        return False, str(e)
    except Exception as e:
        log.error("Bankr error: %s", e)
        return False, str(e)


# ─── P&L Tracking ───────────────────────────────────────────────────────────

class DailyTracker:
    def __init__(self):
        self.today = ""
        self.trades = []
        self.exposure = 0.0

    def _check_day(self):
        today = date.today().isoformat()
        if today != self.today:
            if self.today and self.trades:
                log.info("📅 Day %s: %d trades, $%.2f exposure", self.today, len(self.trades), self.exposure)
            self.today = today
            self.trades = []
            self.exposure = 0.0

    def record(self, direction: str, amount: float, success: bool, window_start: int, price: float, confidence: float):
        self._check_day()
        entry = {
            "time": datetime.now(timezone.utc).isoformat(),
            "direction": direction,
            "amount": amount,
            "success": success,
            "window": window_start,
            "btc_price": round(price, 2),
            "confidence": round(confidence, 3),
        }
        self.trades.append(entry)
        if success:
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


# ─── Notification ────────────────────────────────────────────────────────────

def notify_trade(direction: str, amount: float, price: float, confidence: float,
                 success: bool, trades_today: int, exposure: float, detail: str = "", error: str = ""):
    try:
        data = {
            "time": datetime.now(timezone.utc).isoformat(),
            "type": "fastmarket_5m",
            "direction": direction,
            "amount": amount,
            "price": round(price, 2),
            "confidence": round(confidence, 3),
            "success": success,
            "trades_today": trades_today,
            "exposure_today": round(exposure, 2),
            "detail": detail,
        }
        if error:
            data["error"] = error
        with open(NOTIFY_FILE, "w") as f:
            json.dump(data, f)
    except Exception:
        pass


# ─── State Persistence ───────────────────────────────────────────────────────

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
        return 0, 0


# ─── Main Trading Loop ──────────────────────────────────────────────────────

def main():
    # Load config (from config.json "fastmarket" key, or defaults)
    cfg = dict(DEFAULTS)
    config_path = SKILL_DIR / "config.json"
    if config_path.exists():
        try:
            with open(config_path) as f:
                data = json.load(f)
            if "fastmarket" in data:
                cfg.update(data["fastmarket"])
                log.info("Loaded fastmarket config from config.json")
        except Exception as e:
            log.warning("Config load failed: %s", e)

    tracker = DailyTracker()
    last_trade_window, last_trade_time = load_state()

    log.info("=" * 60)
    log.info("⚡ Polymarket BTC 5-Min Fast Market Trader v3")
    log.info("=" * 60)
    log.info("Trade amount: $%d | Poll interval: %ds", cfg["trade_amount"], cfg["poll_interval"])
    log.info("Min momentum: %.3f%% | Trade window: first %ds of each 5m",
             cfg["min_momentum_pct"], cfg["trade_window_sec"])
    log.info("Max daily: %d trades / $%d loss", cfg["max_daily_trades"], cfg["max_daily_loss"])
    log.info("=" * 60)

    # Per-window state
    window_prices = deque(maxlen=30)  # prices collected during current window
    current_window_start = 0
    window_opening_price = None

    while True:
        try:
            now = time.time()
            ws, we = current_window()
            elapsed_in_window = now - ws
            remaining_in_window = we - now

            # ── New window? Reset per-window tracking ──
            if ws != current_window_start:
                if current_window_start > 0 and window_prices:
                    log.info("─── Window %d ended | %d samples | open=$%.2f close=$%.2f ───",
                             current_window_start, len(window_prices),
                             window_prices[0], window_prices[-1])
                current_window_start = ws
                window_prices.clear()
                window_opening_price = None
                log.info("═══ NEW WINDOW %d (%s UTC) ═══",
                         ws, datetime.fromtimestamp(ws, tz=timezone.utc).strftime("%H:%M"))

            # ── Fetch current price ──
            price = get_best_price(cfg)
            if price is None:
                log.warning("Price fetch failed, retrying in %ds", cfg["poll_interval"])
                time.sleep(cfg["poll_interval"])
                continue

            window_prices.append(price)

            # Record opening price (first reliable price in this window)
            if window_opening_price is None:
                window_opening_price = price
                log.info("📌 Window opening price: $%.2f", price)

            # ── Check daily limits ──
            if tracker.trade_count >= cfg["max_daily_trades"]:
                log.info("Daily trade limit (%d). Sleeping 5m.", tracker.trade_count)
                time.sleep(WINDOW_SECONDS)
                continue

            if tracker.total_exposure >= cfg["max_daily_loss"]:
                log.info("Daily loss cap ($%.2f). Sleeping 5m.", tracker.total_exposure)
                time.sleep(WINDOW_SECONDS)
                continue

            # ── Cooldown: don't trade same window twice ──
            if ws == last_trade_window:
                log.debug("Already traded this window (%d), waiting for next", ws)
                time.sleep(cfg["poll_interval"])
                continue

            # ── Cooldown after last trade ──
            if now - last_trade_time < cfg["cooldown_after_trade"]:
                log.debug("Cooldown: %ds remaining", cfg["cooldown_after_trade"] - (now - last_trade_time))
                time.sleep(cfg["poll_interval"])
                continue

            # ── Only trade in first N seconds of window ──
            if elapsed_in_window > cfg["trade_window_sec"]:
                log.debug("Past trade window (%ds into %ds), waiting for next window",
                          int(elapsed_in_window), cfg["trade_window_sec"])
                # Sleep until next window
                time.sleep(max(1, remaining_in_window + 2))
                continue

            # ── Need minimum samples ──
            if len(window_prices) < cfg["min_samples"]:
                log.debug("Collecting samples (%d/%d)", len(window_prices), cfg["min_samples"])
                time.sleep(cfg["poll_interval"])
                continue

            # ── Calculate momentum ──
            opening = window_opening_price
            current = price
            momentum_pct = ((current - opening) / opening) * 100

            # Also look at recent trend (last 3 samples)
            recent = list(window_prices)[-3:]
            if len(recent) >= 2:
                recent_momentum = ((recent[-1] - recent[0]) / recent[0]) * 100
            else:
                recent_momentum = 0

            # ── Generate signal ──
            direction = None
            confidence = abs(momentum_pct) / 0.5  # normalize: 0.5% move = 100% confidence

            # Require both window momentum AND recent trend to agree
            if momentum_pct > cfg["min_momentum_pct"] and recent_momentum > 0:
                direction = "UP"
            elif momentum_pct < -cfg["min_momentum_pct"] and recent_momentum < 0:
                direction = "DOWN"

            detail = (f"open=${opening:.2f} now=${current:.2f} "
                      f"mom={momentum_pct:+.4f}% recent={recent_momentum:+.4f}% "
                      f"samples={len(window_prices)} t={int(elapsed_in_window)}s")

            if direction:
                confidence = min(confidence, 1.0)
                log.info("🚀 SIGNAL: %s | conf=%.1f%% | %s", direction, confidence * 100, detail)
                log.info("🎯 Market: %s", market_url(ws))

                success, output = place_trade(direction, cfg["trade_amount"], ws, cfg)
                tracker.record(direction, cfg["trade_amount"], success, ws, current, confidence)

                # Always mark window as attempted — never double-trade same window
                last_trade_window = ws
                last_trade_time = time.time()
                save_state(last_trade_window, last_trade_time)

                if success:
                    log.info("✅ Trade placed! %s $%d on %s", direction, cfg["trade_amount"], market_slug(ws))
                    notify_trade(direction, cfg["trade_amount"], current, confidence,
                                 True, tracker.trade_count, tracker.total_exposure, detail)
                else:
                    log.error("❌ Trade failed: %s", output)
                    notify_trade(direction, cfg["trade_amount"], current, confidence,
                                 False, tracker.trade_count, tracker.total_exposure, detail, output)
            else:
                if len(window_prices) % 4 == 0:  # Log every ~60s
                    log.info("📊 HOLD | %s", detail)

            time.sleep(cfg["poll_interval"])

        except KeyboardInterrupt:
            raise
        except Exception as e:
            log.exception("Error in main loop: %s", e)
            time.sleep(30)


if __name__ == "__main__":
    def _sigterm(sig, frame):
        log.info("🛑 SIGTERM — shutting down")
        sys.exit(0)

    signal.signal(signal.SIGTERM, _sigterm)

    try:
        main()
    except KeyboardInterrupt:
        log.info("🛑 Stopped by user")
        sys.exit(0)
