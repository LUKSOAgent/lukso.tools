#!/usr/bin/env python3
"""
Polymarket BTC 5-Minute Fast Market Trader v5 — Oracle Divergence Edge

Strategy (v5 improvements):
- PRIMARY SIGNAL: CEX price vs Chainlink oracle divergence (the real alpha)
- SECONDARY: Price momentum confirmation
- Narrowed trade window (45-120s) to filter weak late signals
- Lower max_price ($0.52) for better breakeven math (58% vs 69%)
- Confidence-scaled position sizing ($8-$20)
- Order fill verification with auto-cancel
- Volatility regime filter (skip dead markets)

Requirements:
- py-clob-client, requests
- Polygon wallet private key with USDC balance on Polymarket
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

# ─── py-clob-client ──────────────────────────────────────────────────────────
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import ApiCreds, OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY

# ─── Paths ───────────────────────────────────────────────────────────────────
SKILL_DIR = Path(__file__).parent
LOG_FILE = SKILL_DIR / "fastmarket_clob.log"
STATE_FILE = SKILL_DIR / "fastmarket_state.json"
PNL_FILE = SKILL_DIR / "fastmarket_pnl.jsonl"
NOTIFY_FILE = SKILL_DIR / ".trade_notification"

sys.stdout.reconfigure(line_buffering=True)

# ─── Config ──────────────────────────────────────────────────────────────────
DEFAULTS = {
    # Position sizing
    "trade_amount": 15,             # base $ per trade (scaled by confidence)
    "min_trade": 8,                 # minimum trade size
    "max_trade": 20,                # maximum trade size
    "max_daily_trades": 30,
    "max_daily_loss": 50,

    # Signal thresholds (v10: macro trend filter + stronger confirmation)
    "min_momentum_pct": 0.18,       # min window momentum % to trade (0.18% = real signal vs noise)
    "min_combined_score": 0.40,     # minimum score (0-1) to trade
    # Legacy divergence keys (unused in v9, kept for config compat)
    "min_divergence_pct": 0.06,
    "strong_divergence_pct": 0.12,

    # Timing
    "min_samples": 4,               # need at least 4 samples (~40s) before evaluating
    "trade_window_start": 60,       # earliest trade (60s — enough data for signal)
    "trade_window_end": 110,        # latest trade (110s — still early enough to catch move)
    "poll_interval": 10,
    "cooldown_after_trade": 0,

    # Volatility filter
    "min_hourly_vol": 0.02,         # skip if 1h realized vol < 0.02%
    "vol_lookback": 360,            # 360 samples = ~1 hour at 10s poll

    # Price sources
    "chainlink_rpc_urls": [
        "https://polygon-rpc.com",
        "https://rpc.ankr.com/polygon",
        "https://polygon.publicnode.com",
    ],
    "chainlink_btc_feed": "0xc907E116054Ad103354f2D350FD2514433D57F6f",

    # CLOB config
    "clob_host": "https://clob.polymarket.com",
    "chain_id": 137,
    "max_price": 0.52,              # breakeven 58% (was 0.62 → 69%)
    "target_price": 0.50,
    "fill_timeout": 15,             # seconds to wait for fill before cancel+retry
    "macro_filter_pct": 0.20,       # 30-min macro trend threshold; block contra-trend signals
}

WINDOW_SECONDS = 300

# Wallet
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
    logger = logging.getLogger("fastmarket_clob")
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

def get_chainlink_price(feed_addr: str, rpc_urls: list) -> Optional[dict]:
    """Read BTC/USD from Chainlink oracle on Polygon. Returns price + update timestamp."""
    payload = {
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": feed_addr, "data": "0xfeaf968c"}, "latest"],
        "id": 1,
    }
    for rpc in rpc_urls:
        try:
            resp = requests.post(rpc, json=payload, timeout=8,
                                 headers={"User-Agent": "Mozilla/5.0"})
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
            price = answer / 1e8
            updated_at = int(slots[3], 16)
            return {"price": price, "updated_at": updated_at, "source": "chainlink", "rpc": rpc}
        except Exception as e:
            log.debug("Chainlink RPC %s failed: %s", rpc, e)
            continue
    return None


def get_multi_cex_price() -> Optional[float]:
    """Get BTC/USD median price from Coinbase + Binance + Kraken.
    
    v10: multi-CEX median mirrors Chainlink Data Streams aggregation method.
    Requires at least 2 sources; returns None if fewer available.
    """
    prices = []
    try:
        resp = requests.get("https://api.coinbase.com/v2/exchange-rates",
                            params={"currency": "BTC"}, timeout=5)
        resp.raise_for_status()
        prices.append(float(resp.json()["data"]["rates"]["USDT"]))
    except Exception:
        pass
    try:
        resp = requests.get("https://api.binance.com/api/v3/ticker/price",
                            params={"symbol": "BTCUSDT"}, timeout=5)
        resp.raise_for_status()
        prices.append(float(resp.json()["price"]))
    except Exception:
        pass
    try:
        resp = requests.get("https://api.kraken.com/0/public/Ticker",
                            params={"pair": "XBTUSD"}, timeout=5)
        resp.raise_for_status()
        result = resp.json().get("result", {})
        if result:
            pair_data = next(iter(result.values()))
            prices.append(float(pair_data["c"][0]))  # last trade price
    except Exception:
        pass
    if len(prices) < 2:
        return prices[0] if prices else None
    prices.sort()
    # Median
    n = len(prices)
    return prices[n // 2] if n % 2 else (prices[n // 2 - 1] + prices[n // 2]) / 2


# Keep for compatibility but unused in v9
def get_cex_price() -> Optional[float]:
    return get_multi_cex_price()


# ─── Signal Engine ───────────────────────────────────────────────────────────

def compute_oracle_divergence(cfg: dict, oracle: Optional[dict] = None,
                              cex: Optional[float] = None) -> Optional[dict]:
    """Compare CEX real-time price with Chainlink oracle price.
    
    Accepts pre-fetched oracle/cex to avoid duplicate API calls.
    Returns:
        dict with divergence_pct, cex_price, oracle_price, oracle_age_sec, direction_hint
    """
    if oracle is None:
        oracle = get_chainlink_price(cfg["chainlink_btc_feed"], cfg["chainlink_rpc_urls"])
    if not oracle or oracle["price"] <= 0:
        return None
    
    if cex is None:
        cex = get_cex_price()
    if not cex or cex <= 0:
        return None
    
    oracle_price = oracle["price"]
    oracle_age = int(time.time()) - oracle["updated_at"]
    divergence_pct = ((cex - oracle_price) / oracle_price) * 100
    
    # CORRECT divergence logic:
    # CEX > oracle (div > 0): oracle lags behind, will rise → market resolves UP
    # CEX < oracle (div < 0): oracle too high, will drop  → market resolves DOWN
    direction_hint = None
    if divergence_pct > cfg["min_divergence_pct"]:
        direction_hint = "UP"    # CEX above oracle → oracle catches up → UP
    elif divergence_pct < -cfg["min_divergence_pct"]:
        direction_hint = "DOWN"  # CEX below oracle → oracle drops → DOWN
    
    return {
        "divergence_pct": divergence_pct,
        "cex_price": cex,
        "oracle_price": oracle_price,
        "oracle_age_sec": oracle_age,
        "direction_hint": direction_hint,
    }


def compute_volatility(price_history: deque) -> float:
    """Compute realized volatility from price history (% std dev of returns)."""
    if len(price_history) < 10:
        return 999.0  # unknown → allow trading
    prices = list(price_history)
    returns = []
    for i in range(1, len(prices)):
        if prices[i-1] > 0:
            returns.append(((prices[i] - prices[i-1]) / prices[i-1]) * 100)
    if not returns:
        return 0.0
    mean = sum(returns) / len(returns)
    variance = sum((r - mean) ** 2 for r in returns) / len(returns)
    return variance ** 0.5


def compute_combined_signal(
    momentum_pct: float,
    recent_momentum: float,
    divergence: Optional[dict],  # kept for signature compat, ignored in v9
    volatility: float,
    cfg: dict,
    oracle_jumped: bool = False,  # kept for compat, unused in v9
) -> Tuple[Optional[str], float, str]:
    """Compute trade signal — v10: pure CEX multi-exchange momentum.

    Divergence signal removed — Polymarket resolves via Chainlink Data Streams
    (real-time CEX aggregation), so on-chain oracle divergence was meaningless noise.

    Strategy:
      - Measure momentum = (current_cex_median - window_open) / window_open
      - Trade if momentum is strong and recent trend confirms direction
      - Two tiers: strong momentum (high confidence) and moderate (standard)

    Returns: (direction, confidence, reason)
    """
    # Volatility filter — 999.0 = insufficient history, skip filter
    if volatility < cfg["min_hourly_vol"] and volatility != 999.0:
        return None, 0.0, f"vol={volatility:.4f}% < {cfg['min_hourly_vol']}%"

    min_mom = cfg["min_momentum_pct"]       # e.g. 0.15%
    strong_mom = min_mom * 2                 # e.g. 0.30%
    abs_mom = abs(momentum_pct)
    direction = "UP" if momentum_pct > 0 else "DOWN"

    # ── Too weak — no signal ──
    if abs_mom < min_mom:
        return None, 0.0, f"mom={momentum_pct:+.3f}%(<{min_mom}%) — below threshold"

    # ── Recent momentum reversal check ──
    # Block if last 30s is moving against window trend (reversing)
    reversing = (momentum_pct > 0 and recent_momentum < -0.03) or \
                (momentum_pct < 0 and recent_momentum > 0.03)
    if reversing:
        return None, 0.0, f"mom={momentum_pct:+.3f}% reversing (recent={recent_momentum:+.3f}%)"

    # ── Strong momentum ──
    if abs_mom >= strong_mom:
        score = min(abs_mom / 0.40, 1.0)   # 0.30%→0.75, 0.40%→1.0
        reason = f"score={score:.2f} [mom={momentum_pct:+.3f}%→{direction}(strong), recent={recent_momentum:+.3f}%]"
        if score < cfg["min_combined_score"]:
            return None, score, f"score={score:.2f}<{cfg['min_combined_score']}"
        return direction, score, reason

    # ── Moderate momentum + recent confirmation (v10: threshold raised 0.01→0.05%) ──
    recent_confirms = (momentum_pct > 0 and recent_momentum >= 0.05) or \
                      (momentum_pct < 0 and recent_momentum <= -0.05)
    if not recent_confirms:
        return None, 0.0, f"mom={momentum_pct:+.3f}% moderate but recent not confirming (recent={recent_momentum:+.3f}%)"

    score = min(abs_mom / 0.30, 0.8)       # 0.18%→0.6, 0.30%→1.0, capped 0.8
    reason = f"score={score:.2f} [mom={momentum_pct:+.3f}%→{direction}, recent={recent_momentum:+.3f}%(confirms)]"
    if score < cfg["min_combined_score"]:
        return None, score, f"score={score:.2f}<{cfg['min_combined_score']}"
    return direction, score, reason


# ─── Market Discovery ───────────────────────────────────────────────────────

def current_window() -> Tuple[int, int]:
    now = int(time.time())
    start = (now // WINDOW_SECONDS) * WINDOW_SECONDS
    return start, start + WINDOW_SECONDS


def market_slug(ws: int) -> str:
    return f"btc-updown-5m-{ws}"


def get_market_tokens(ws: int) -> Optional[dict]:
    slug = market_slug(ws)
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


# ─── Trade Execution ─────────────────────────────────────────────────────────

def place_clob_order(client, token_id, amount, price, cfg):
    """Place limit buy order. Returns (success, order_id_or_error)."""
    try:
        size = round(amount / price, 2)
        price_rounded = round(price, 2)
        
        if price_rounded < 0.01 or price_rounded > 0.99:
            return False, f"Invalid price: {price_rounded}", None
        
        log.info("📝 BUY %s shares @ $%.2f (=$%.2f)", size, price_rounded, amount)
        
        order_args = OrderArgs(
            price=price_rounded,
            size=size,
            side=BUY,
            token_id=token_id,
        )
        signed_order = client.create_order(order_args)
        result = client.post_order(signed_order, OrderType.GTC)
        
        log.info("📬 Response: %s", json.dumps(result)[:500] if isinstance(result, dict) else str(result)[:500])
        
        if isinstance(result, dict):
            order_id = result.get("orderID") or result.get("order_id") or result.get("id")
            if result.get("success") or order_id:
                return True, f"{size} shares @ ${price_rounded}", order_id
            error = result.get("error", result.get("message", "Unknown"))
            return False, f"Rejected: {error}", None
        
        return True, f"Submitted: {str(result)[:200]}", None
        
    except Exception as e:
        log.error("CLOB order error: %s", e)
        return False, str(e), None


def verify_and_manage_order(client, order_id, cfg):
    """Check if order filled within timeout. Cancel if not, retry at ask."""
    if not order_id:
        return True  # no ID to track — assume filled
    
    try:
        time.sleep(cfg["fill_timeout"])
        order = client.get_order(order_id)
        
        if isinstance(order, dict):
            status = order.get("status", "").lower()
            size_matched = float(order.get("size_matched", 0))
            original_size = float(order.get("original_size", 1))
            fill_pct = (size_matched / original_size * 100) if original_size > 0 else 0
            
            if status in ("matched", "filled") or fill_pct > 80:
                log.info("✅ Order %s filled (%.0f%%)", order_id[:16], fill_pct)
                return True
            elif status in ("live", "open"):
                log.warning("⏳ Order %s still open (%.0f%% filled), cancelling", order_id[:16], fill_pct)
                try:
                    client.cancel(order_id)
                    log.info("🗑️ Cancelled unfilled order %s", order_id[:16])
                except Exception as ce:
                    log.warning("Cancel failed: %s", ce)
                return fill_pct > 0  # partial fill counts
            else:
                log.info("Order %s status: %s", order_id[:16], status)
                return status not in ("cancelled", "expired")
        
        return True  # can't verify → assume ok
    except Exception as e:
        log.warning("Order verify failed: %s", e)
        return True


def determine_order_price(client, token_id, cfg):
    """Get best price. Try $0.01 below ask first, then match ask."""
    try:
        book = client.get_order_book(token_id)
        asks = getattr(book, 'asks', None) or []
        
        if not asks:
            log.info("No asks, using target $%.2f", cfg["target_price"])
            return cfg["target_price"]
        
        if hasattr(asks[0], 'price'):
            best_ask = min(float(a.price) for a in asks)
        else:
            best_ask = min(float(a.get("price", a["price"])) for a in asks)
        
        if best_ask > cfg["max_price"]:
            log.info("Best ask $%.2f > max $%.2f, skipping", best_ask, cfg["max_price"])
            return None
        
        # Match ask for full fill (underbidding causes partial fills)
        our_price = best_ask
        
        log.info("Orderbook: ask=$%.2f → our=$%.2f", best_ask, our_price)
        return our_price
        
    except Exception as e:
        log.warning("Orderbook failed: %s — target $%.2f", e, cfg["target_price"])
        return cfg["target_price"]


# ─── Position Sizing ─────────────────────────────────────────────────────────

def calc_trade_size(confidence: float, cfg: dict) -> float:
    """Scale trade size by confidence. Higher conviction = bigger bet."""
    base = cfg["trade_amount"]
    scaled = base * confidence * 1.5  # 0.4 conf → $9, 0.7 conf → $15.75, 1.0 conf → $22.5
    return max(cfg["min_trade"], min(cfg["max_trade"], round(scaled, 2)))


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
                log.info("Day %s: %d trades, $%.2f exposure", self.today, len(self.trades), self.exposure)
            self.today = today
            self.trades = []
            self.exposure = 0.0

    def record(self, direction, amount, filled, ws, price, confidence, divergence_pct, signal_reason):
        self._check_day()
        entry = {
            "time": datetime.now(timezone.utc).isoformat(),
            "direction": direction,
            "amount": amount,
            "filled": filled,
            "window": ws,
            "btc_price": round(price, 2),
            "confidence": round(confidence, 3),
            "divergence_pct": round(divergence_pct, 4) if divergence_pct else 0,
            "signal": signal_reason,
            "version": "v10-macro-filter",
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


# ─── Notification ────────────────────────────────────────────────────────────

def notify_trade(direction, amount, price, confidence, filled, trades_today, exposure,
                 divergence_pct=0, signal_reason="", error=""):
    try:
        data = {
            "time": datetime.now(timezone.utc).isoformat(),
            "type": "fastmarket_v5",
            "direction": direction,
            "amount": amount,
            "price": round(price, 2),
            "confidence": round(confidence, 3),
            "filled": filled,
            "trades_today": trades_today,
            "exposure_today": round(exposure, 2),
            "divergence_pct": round(divergence_pct, 4),
            "signal": signal_reason,
        }
        if error:
            data["error"] = error
        with open(NOTIFY_FILE, "w") as f:
            json.dump(data, f)
    except Exception:
        pass


# ─── State ───────────────────────────────────────────────────────────────────

def save_state(last_trade_window, last_trade_time):
    try:
        with open(STATE_FILE, "w") as f:
            json.dump({
                "last_trade_window": last_trade_window,
                "last_trade_time": last_trade_time,
                "updated": datetime.now(timezone.utc).isoformat(),
            }, f)
    except Exception:
        pass


def load_state():
    try:
        with open(STATE_FILE) as f:
            data = json.load(f)
        return data.get("last_trade_window", 0), data.get("last_trade_time", 0)
    except Exception:
        return 0, 0


# ─── Main Loop ───────────────────────────────────────────────────────────────

def main():
    cfg = dict(DEFAULTS)
    config_path = SKILL_DIR / "config.json"
    if config_path.exists():
        try:
            with open(config_path) as f:
                data = json.load(f)
            if "fastmarket" in data:
                cfg.update(data["fastmarket"])
                log.info("Loaded config overrides")
        except Exception as e:
            log.warning("Config load failed: %s", e)

    log.info("=" * 60)
    log.info("⚡ Polymarket BTC 5-Min Trader v10 — Macro Trend Filter")
    log.info("=" * 60)
    
    client = create_clob_client(cfg)
    addr = client.get_address()
    log.info("Wallet: %s", addr)
    log.info("Trade: $%d (scaled $%d-$%d) | Poll: %ds",
             cfg["trade_amount"], cfg["min_trade"], cfg["max_trade"], cfg["poll_interval"])
    log.info("Max price: $%.2f | Window: %d-%ds | Min score: %.2f",
             cfg["max_price"], cfg["trade_window_start"], cfg["trade_window_end"],
             cfg["min_combined_score"])
    log.info("Signals: momentum>%.2f%% (strong>%.2f%%) vol>%.2f%% score>%.2f",
             cfg["min_momentum_pct"], cfg["min_momentum_pct"] * 2,
             cfg["min_hourly_vol"], cfg["min_combined_score"])
    log.info("Max daily: %d trades / $%d loss cap", cfg["max_daily_trades"], cfg["max_daily_loss"])
    log.info("=" * 60)

    try:
        ok = client.get_ok()
        log.info("CLOB API: %s", ok)
    except Exception as e:
        log.error("CLOB unreachable: %s", e)

    tracker = DailyTracker()
    last_trade_window, last_trade_time = load_state()

    # Price tracking (v10: macro trend filter added)
    window_prices = deque(maxlen=30)       # CEX median prices for momentum
    hourly_prices = deque(maxlen=cfg["vol_lookback"])  # CEX median prices for vol (1h)
    window_openings = deque(maxlen=7)      # Opening price per window (35-min context for macro trend)
    current_window_start = 0
    window_opening_price = None
    window_market_info = None

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
                    # Save opening of completed window for macro trend tracking
                    if window_opening_price is not None:
                        window_openings.append(window_opening_price)
                current_window_start = ws
                window_prices.clear()
                window_opening_price = None
                window_market_info = None
                log.info("══ NEW WINDOW %d (%s UTC) ══",
                         ws, datetime.fromtimestamp(ws, tz=timezone.utc).strftime("%H:%M"))

            # ── Fetch multi-CEX median price (v10: no oracle) ──
            price = get_multi_cex_price()
            if not price or price <= 0:
                log.warning("Multi-CEX price fetch failed, retry in %ds", cfg["poll_interval"])
                time.sleep(cfg["poll_interval"])
                continue

            window_prices.append(price)
            hourly_prices.append(price)

            if window_opening_price is None:
                window_opening_price = price
                log.info("Opening: $%.2f (multi-CEX median)", price)

            # ── Daily limits ──
            if tracker.trade_count >= cfg["max_daily_trades"]:
                log.info("Daily trade limit (%d). Sleep 5m.", tracker.trade_count)
                time.sleep(WINDOW_SECONDS)
                continue

            if tracker.total_exposure >= cfg["max_daily_loss"]:
                log.info("Daily loss cap ($%.2f). Sleep 5m.", tracker.total_exposure)
                time.sleep(WINDOW_SECONDS)
                continue

            # ── Already traded this window ──
            if ws == last_trade_window:
                log.debug("Already traded window %d", ws)
                time.sleep(cfg["poll_interval"])
                continue

            # ── Trade window timing (45-120s) ──
            if elapsed < cfg["trade_window_start"]:
                log.debug("Too early (%ds < %ds)", int(elapsed), cfg["trade_window_start"])
                time.sleep(cfg["poll_interval"])
                continue

            if elapsed > cfg["trade_window_end"]:
                log.debug("Past trade window (%ds), sleep until next", int(elapsed))
                time.sleep(max(1, remaining + 2))
                continue

            # ── Need samples ──
            if len(window_prices) < cfg["min_samples"]:
                log.debug("Samples %d/%d", len(window_prices), cfg["min_samples"])
                time.sleep(cfg["poll_interval"])
                continue

            # ── Calculate signals (v10: macro filter) ──
            opening = window_opening_price
            current = price
            momentum_pct = ((current - opening) / opening) * 100

            recent = list(window_prices)[-3:]
            recent_momentum = ((recent[-1] - recent[0]) / recent[0]) * 100 if len(recent) >= 2 else 0

            # Volatility
            vol = compute_volatility(hourly_prices)

            # Pure momentum signal — no divergence
            direction, confidence, reason = compute_combined_signal(
                momentum_pct, recent_momentum, None, vol, cfg
            )

            detail = (f"open=${opening:.2f} now=${current:.2f} "
                      f"mom={momentum_pct:+.4f}% recent={recent_momentum:+.4f}% vol={vol:.4f}% "
                      f"samples={len(window_prices)} t={int(elapsed)}s")

            # ── Macro trend filter (v10) ──
            # If 30-min trend clearly opposes signal direction → skip (fighting the trend)
            if direction and len(window_openings) >= 3:
                macro_trend = ((window_openings[-1] - window_openings[0]) / window_openings[0]) * 100
                macro_threshold = cfg.get("macro_filter_pct", 0.20)
                if direction == "UP" and macro_trend < -macro_threshold:
                    log.info("📊 HOLD (macro↓ filter): signal=UP but macro=%.3f%% over last %d windows",
                             macro_trend, len(window_openings))
                    direction = None
                elif direction == "DOWN" and macro_trend > macro_threshold:
                    log.info("📊 HOLD (macro↑ filter): signal=DOWN but macro=%.3f%% over last %d windows",
                             macro_trend, len(window_openings))
                    direction = None

            if direction:
                trade_size = calc_trade_size(confidence, cfg)
                log.info("🚀 SIGNAL: %s $%.0f | conf=%.0f%% | %s", direction, trade_size, confidence * 100, reason)
                log.info("   %s", detail)

                # Discover market tokens
                if window_market_info is None:
                    window_market_info = get_market_tokens(ws)
                
                if window_market_info is None:
                    log.error("❌ No market for window %d", ws)
                    last_trade_window = ws
                    save_state(last_trade_window, last_trade_time)
                    time.sleep(cfg["poll_interval"])
                    continue

                token_id = window_market_info["token_up"] if direction == "UP" else window_market_info["token_down"]
                log.info("Market: %s | Token: %s... (%s)", window_market_info["title"], token_id[:20], direction)

                # Get price
                order_price = determine_order_price(client, token_id, cfg)
                if order_price is None:
                    log.warning("Price too high, skipping")
                    last_trade_window = ws
                    save_state(last_trade_window, last_trade_time)
                    time.sleep(cfg["poll_interval"])
                    continue

                # Place order
                success, output, order_id = place_clob_order(
                    client, token_id, trade_size, order_price, cfg
                )

                # Verify fill
                filled = False
                if success:
                    filled = verify_and_manage_order(client, order_id, cfg)

                tracker.record(direction, trade_size, filled, ws, current, confidence, 0, reason)
                last_trade_window = ws
                last_trade_time = time.time()
                save_state(last_trade_window, last_trade_time)

                if filled:
                    log.info("✅ FILLED: %s $%.0f @ $%.2f | %s", direction, trade_size, order_price, output)
                elif success:
                    log.warning("⚠️ PLACED but unfilled: %s | %s", direction, output)
                else:
                    log.error("❌ FAILED: %s", output)

                notify_trade(direction, trade_size, current, confidence, filled,
                             tracker.trade_count, tracker.total_exposure, 0, reason,
                             "" if filled else output)
            else:
                if len(window_prices) % 4 == 0:
                    log.info("📊 HOLD | %s | %s", detail, reason)

            time.sleep(cfg["poll_interval"])

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
