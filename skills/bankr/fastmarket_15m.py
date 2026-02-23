#!/usr/bin/env python3
"""
Polymarket 15-Minute Fast Market Trader — Multi-Coin Oracle Edge

Trades BTC, ETH, SOL 15-minute "Up or Down" markets using Chainlink oracle
divergence from CEX price. 15-min windows give more signal stability than 5-min.

Strategy:
1. Monitor Chainlink oracle price vs Binance/CoinGecko spot price
2. When oracle lags behind a clear move (divergence > threshold), trade the direction
3. Also use 15-min momentum (price trend over the window) as confirmation
4. Place limit orders at favorable prices for better fill rates

Key advantage over 5-min: more time for trends to develop, less noise.
"""

import os
import sys
import json
import time
import signal
import logging
import requests
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Tuple, Dict, List
from collections import deque

from py_clob_client.client import ClobClient
from py_clob_client.clob_types import ApiCreds, OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY

# ─── Paths ───────────────────────────────────────────────────────────────────
SKILL_DIR = Path(__file__).parent
LOG_FILE = SKILL_DIR / "fastmarket_15m.log"
STATE_FILE = SKILL_DIR / "fastmarket_15m_state.json"
PNL_FILE = SKILL_DIR / "fastmarket_15m_pnl.jsonl"
NOTIFY_FILE = SKILL_DIR / ".trade_notification"

# ─── Config ──────────────────────────────────────────────────────────────────
CONFIG = {
    # Position sizing
    "trade_amount": 10,          # $ per trade
    "min_trade": 5,
    "max_trade": 15,
    "max_daily_trades": 40,
    "max_daily_loss": 60,        # stop trading if down $60 in a day

    # Signal thresholds (tuned for 15-min windows)
    "min_momentum_pct": 0.10,    # min price move % over monitoring window
    "min_divergence_pct": 0.05,  # oracle vs CEX divergence
    "strong_signal_score": 0.65, # high confidence threshold
    "min_signal_score": 0.40,    # minimum combined score to trade

    # Timing (within 900-second window)
    "trade_window_start": 120,   # start looking at 2 min in (enough data)
    "trade_window_end": 600,     # stop at 10 min (5 min before close)
    "poll_interval": 15,         # check every 15 seconds
    "min_samples": 6,            # need 6+ price samples before trading

    # Price
    "max_price": 0.55,           # don't buy above 55 cents
    "target_price": 0.50,        # ideal entry at 50/50

    # Coins to trade
    "coins": ["btc", "eth", "sol"],

    # CLOB
    "clob_host": "https://clob.polymarket.com",
    "chain_id": 137,
    "fill_timeout": 20,
}

WINDOW_SECONDS = 900  # 15 minutes

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

# Chainlink price feeds on Polygon
CHAINLINK_FEEDS = {
    "btc": "0xc907E116054Ad103354f2D350FD2514433D57F6f",
    "eth": "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    "sol": "0x4ffC43a60e009B551865A93d232E33Fce9f01507",
}

COINGECKO_IDS = {
    "btc": "bitcoin",
    "eth": "ethereum",
    "sol": "solana",
}

RPC_URLS = [
    "https://polygon.publicnode.com",
    "https://rpc.ankr.com/polygon",
    "https://polygon-rpc.com",
]

# ─── Logging ─────────────────────────────────────────────────────────────────
def setup_logging():
    logger = logging.getLogger("fastmarket_15m")
    logger.handlers.clear()
    logger.setLevel(logging.DEBUG)
    logger.propagate = False
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    logger.addHandler(fh)
    sh = logging.StreamHandler()
    sh.setLevel(logging.INFO)
    sh.setFormatter(fmt)
    logger.addHandler(sh)
    return logger

log = setup_logging()

# ─── Globals ─────────────────────────────────────────────────────────────────
running = True
daily_trades = 0
daily_pnl = 0.0
price_history: Dict[str, deque] = {coin: deque(maxlen=120) for coin in CONFIG["coins"]}


def handle_signal(signum, frame):
    global running
    log.info("Signal %d received, shutting down...", signum)
    running = False

signal.signal(signal.SIGINT, handle_signal)
signal.signal(signal.SIGTERM, handle_signal)


# ─── CLOB Client ─────────────────────────────────────────────────────────────
def create_client() -> ClobClient:
    return ClobClient(
        CONFIG["clob_host"],
        key=WALLET_KEY,
        chain_id=CONFIG["chain_id"],
        creds=CLOB_CREDS,
    )


# ─── Price Functions ─────────────────────────────────────────────────────────

def get_chainlink_price(coin: str) -> Optional[float]:
    """Get latest price from Chainlink oracle on Polygon."""
    feed = CHAINLINK_FEEDS.get(coin)
    if not feed:
        return None

    # latestRoundData() selector
    data = "0xfeaf968c"

    for rpc in RPC_URLS:
        try:
            r = requests.post(rpc, json={
                "jsonrpc": "2.0",
                "method": "eth_call",
                "params": [{"to": feed, "data": data}, "latest"],
                "id": 1,
            }, timeout=5)

            result = r.json().get("result")
            if not result or result == "0x":
                continue

            # Decode: (roundId, answer, startedAt, updatedAt, answeredInRound)
            # answer is at offset 32 bytes (index 1), 8 decimals
            hex_answer = result[2 + 64:2 + 128]  # second 32-byte word
            price = int(hex_answer, 16) / 1e8
            if price > 0:
                return price
        except Exception:
            continue

    return None


def get_cex_price(coin: str) -> Optional[float]:
    """Get current price from CoinGecko."""
    cg_id = COINGECKO_IDS.get(coin)
    if not cg_id:
        return None

    try:
        r = requests.get(
            f"https://api.coingecko.com/api/v3/simple/price?ids={cg_id}&vs_currencies=usd",
            timeout=5,
        )
        return r.json().get(cg_id, {}).get("usd")
    except Exception:
        return None


def get_binance_price(coin: str) -> Optional[float]:
    """Get current price from Binance (faster than CoinGecko)."""
    symbols = {"btc": "BTCUSDT", "eth": "ETHUSDT", "sol": "SOLUSDT"}
    sym = symbols.get(coin)
    if not sym:
        return None

    try:
        r = requests.get(f"https://api.binance.com/api/v3/ticker/price?symbol={sym}", timeout=3)
        return float(r.json()["price"])
    except Exception:
        return None


# ─── Market Discovery ────────────────────────────────────────────────────────

def get_current_window() -> int:
    """Get the start timestamp of the current 15-min window."""
    now = int(time.time())
    return (now // WINDOW_SECONDS) * WINDOW_SECONDS


def get_window_elapsed() -> int:
    """Seconds elapsed in current window."""
    now = int(time.time())
    ws = (now // WINDOW_SECONDS) * WINDOW_SECONDS
    return now - ws


def get_market_tokens(coin: str, ws: int) -> Optional[Dict]:
    """Discover the 15-min market for a given coin and window."""
    slug = f"{coin}-updown-15m-{ws}"
    try:
        r = requests.get(
            f"https://gamma-api.polymarket.com/events?slug={slug}",
            timeout=10,
        )
        data = r.json()
        if not data:
            return None

        ev = data[0]
        mkts = ev.get("markets", [])
        if not mkts:
            return None

        m = mkts[0]
        if m.get("closed", False):
            return None

        token_ids = json.loads(m.get("clobTokenIds", "[]"))
        if len(token_ids) < 2:
            return None

        return {
            "condition_id": m.get("conditionId"),
            "token_up": token_ids[0],
            "token_down": token_ids[1],
            "title": ev.get("title", slug),
            "slug": slug,
            "prices": json.loads(m.get("outcomePrices", "[]")),
        }
    except Exception as e:
        log.debug("Market discovery failed for %s: %s", slug, e)
        return None


# ─── Signal Analysis ─────────────────────────────────────────────────────────

def analyze_signal(coin: str) -> Tuple[Optional[str], float, Dict]:
    """
    Analyze price data to determine trade direction.
    Returns: (direction, confidence_score, details)
    direction: "up" or "down" or None
    """
    history = price_history[coin]
    if len(history) < CONFIG["min_samples"]:
        return None, 0.0, {"reason": "insufficient data"}

    # Get current prices
    oracle_price = get_chainlink_price(coin)
    cex_price = get_binance_price(coin) or get_cex_price(coin)

    if not oracle_price or not cex_price:
        return None, 0.0, {"reason": "price fetch failed"}

    # Store for history
    history.append({
        "ts": time.time(),
        "oracle": oracle_price,
        "cex": cex_price,
    })

    # === Signal 1: Oracle Divergence ===
    # If CEX moved but oracle hasn't caught up, oracle will update toward CEX
    divergence_pct = (cex_price - oracle_price) / oracle_price * 100
    div_signal = 0.0
    if abs(divergence_pct) >= CONFIG["min_divergence_pct"]:
        # Direction: CEX is leading, oracle will follow
        div_signal = min(abs(divergence_pct) / 0.20, 1.0)  # normalize to 0-1

    # === Signal 2: Momentum (price trend over our samples) ===
    prices = [h["cex"] for h in history]
    if len(prices) >= 4:
        recent_avg = sum(prices[-3:]) / 3
        early_avg = sum(prices[:3]) / 3
        momentum_pct = (recent_avg - early_avg) / early_avg * 100
    else:
        momentum_pct = 0.0

    mom_signal = 0.0
    if abs(momentum_pct) >= CONFIG["min_momentum_pct"]:
        mom_signal = min(abs(momentum_pct) / 0.30, 1.0)

    # === Signal 3: Short-term micro-trend (last 3 samples) ===
    micro_trend = 0.0
    if len(prices) >= 3:
        ups = sum(1 for i in range(1, min(5, len(prices))) if prices[-i] > prices[-i-1] if i < len(prices))
        micro_trend = ups / min(4, len(prices) - 1)

    # === Combined Score ===
    # Weight: divergence 40%, momentum 40%, micro 20%
    combined = div_signal * 0.4 + mom_signal * 0.4 + (micro_trend if momentum_pct > 0 else (1 - micro_trend)) * 0.2

    # Direction
    if divergence_pct > 0 and momentum_pct > 0:
        direction = "up"
    elif divergence_pct < 0 and momentum_pct < 0:
        direction = "down"
    elif abs(divergence_pct) > abs(momentum_pct) * 2:
        direction = "up" if divergence_pct > 0 else "down"
    elif abs(momentum_pct) > abs(divergence_pct) * 2:
        direction = "up" if momentum_pct > 0 else "down"
    else:
        direction = None  # conflicting signals

    details = {
        "oracle": round(oracle_price, 2),
        "cex": round(cex_price, 2),
        "divergence_pct": round(divergence_pct, 4),
        "momentum_pct": round(momentum_pct, 4),
        "div_signal": round(div_signal, 3),
        "mom_signal": round(mom_signal, 3),
        "micro_trend": round(micro_trend, 3),
        "combined": round(combined, 3),
        "samples": len(history),
    }

    if direction and combined >= CONFIG["min_signal_score"]:
        return direction, combined, details
    else:
        return None, combined, details


# ─── Trade Execution ─────────────────────────────────────────────────────────

def place_trade(client: ClobClient, token_id: str, amount: float, price: float) -> Optional[str]:
    """Place a limit buy order. Returns order ID or None."""
    try:
        size = round(amount / price, 2)
        if price < 0.01 or price > 0.99:
            log.error("Invalid price: %.3f", price)
            return None

        order_args = OrderArgs(price=price, size=size, side=BUY, token_id=token_id)
        signed = client.create_order(order_args)
        resp = client.post_order(signed, OrderType.GTC)

        log.info("Order response: %s", resp)

        if isinstance(resp, dict) and resp.get("success"):
            order_id = resp.get("orderID", "")
            status = resp.get("status", "")
            log.info("✅ Order placed: %s shares @ $%.2f = $%.2f [%s]", size, price, amount, status)
            return order_id
        else:
            log.error("❌ Order failed: %s", resp)
            return None

    except Exception as e:
        log.error("Order error: %s", e)
        return None


def check_fill(client: ClobClient, order_id: str) -> Tuple[bool, float]:
    """Check if order was filled. Returns (filled, amount_matched)."""
    try:
        order = client.get_order(order_id)
        if isinstance(order, dict):
            status = order.get("status", "").upper()
            matched = float(order.get("size_matched", 0))
            original = float(order.get("original_size", 0))
            fill_pct = matched / original * 100 if original > 0 else 0

            if status == "MATCHED" or fill_pct > 50:
                return True, matched * float(order.get("price", 0))
            elif status in ("CANCELLED", "EXPIRED"):
                return False, 0
    except Exception as e:
        log.debug("Fill check error: %s", e)

    return False, 0


# ─── State Management ────────────────────────────────────────────────────────

def save_state(state: Dict):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f)


def load_state() -> Dict:
    try:
        with open(STATE_FILE) as f:
            return json.load(f)
    except:
        return {"daily_trades": 0, "daily_pnl": 0.0, "date": "", "trades": []}


def log_trade(trade_data: Dict):
    with open(PNL_FILE, "a") as f:
        f.write(json.dumps(trade_data) + "\n")


def notify(msg: str):
    with open(NOTIFY_FILE, "w") as f:
        f.write(msg)


# ─── Main Loop ───────────────────────────────────────────────────────────────

def main():
    global running, daily_trades, daily_pnl

    log.info("=" * 60)
    log.info("15-Minute Fast Market Trader starting")
    log.info("Coins: %s", CONFIG["coins"])
    log.info("Trade amount: $%d (range $%d-$%d)", CONFIG["trade_amount"], CONFIG["min_trade"], CONFIG["max_trade"])
    log.info("=" * 60)

    client = create_client()

    # Verify CLOB connection
    try:
        ok = client.get_ok()
        log.info("CLOB API: %s", ok)
    except Exception as e:
        log.error("CLOB unreachable: %s", e)
        return

    state = load_state()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if state.get("date") != today:
        state = {"daily_trades": 0, "daily_pnl": 0.0, "date": today, "trades": []}

    daily_trades = state["daily_trades"]
    daily_pnl = state["daily_pnl"]

    traded_windows: Dict[str, set] = {coin: set() for coin in CONFIG["coins"]}
    last_sample_time = 0

    while running:
        try:
            now = time.time()
            elapsed = get_window_elapsed()
            ws = get_current_window()

            # Check daily limits
            if daily_trades >= CONFIG["max_daily_trades"]:
                log.info("Daily trade limit reached (%d). Sleeping 5 min...", daily_trades)
                time.sleep(300)
                continue

            if daily_pnl <= -CONFIG["max_daily_loss"]:
                log.warning("Daily loss limit hit ($%.2f). Stopping.", daily_pnl)
                notify(f"⚠️ 15m bot stopped: daily loss ${abs(daily_pnl):.2f}")
                break

            # Sample prices every poll_interval
            if now - last_sample_time >= CONFIG["poll_interval"]:
                for coin in CONFIG["coins"]:
                    cex = get_binance_price(coin)
                    oracle = get_chainlink_price(coin)
                    if cex and oracle:
                        price_history[coin].append({
                            "ts": now,
                            "oracle": oracle,
                            "cex": cex,
                        })
                last_sample_time = now

            # Only trade within the window
            if elapsed < CONFIG["trade_window_start"] or elapsed > CONFIG["trade_window_end"]:
                if elapsed < CONFIG["trade_window_start"]:
                    wait = CONFIG["trade_window_start"] - elapsed
                    log.debug("Window %d: %ds until trade window opens, sleeping %ds", ws, wait, min(wait, 30))
                    time.sleep(min(wait, 30))
                else:
                    # Past trade window, wait for next
                    wait = WINDOW_SECONDS - elapsed + 10
                    log.debug("Window %d: past trade window, next in %ds", ws, wait)

                    # Reset price history for fresh window
                    for coin in CONFIG["coins"]:
                        price_history[coin].clear()

                    time.sleep(min(wait, 60))
                continue

            # Check each coin for opportunities
            for coin in CONFIG["coins"]:
                window_key = f"{coin}-{ws}"
                if window_key in traded_windows.get(coin, set()):
                    continue  # already traded this window

                # Get market tokens
                market = get_market_tokens(coin, ws)
                if not market:
                    log.debug("%s: no 15m market for window %d", coin.upper(), ws)
                    continue

                # Analyze signal
                direction, score, details = analyze_signal(coin)

                if direction is None:
                    log.debug("%s [%ds]: no signal (score=%.3f) %s",
                             coin.upper(), elapsed, score,
                             json.dumps({k: v for k, v in details.items() if k != "samples"}))
                    continue

                log.info("%s [%ds]: SIGNAL %s (score=%.3f) %s",
                         coin.upper(), elapsed, direction.upper(), score, json.dumps(details))

                # Determine token and price
                if direction == "up":
                    token_id = market["token_up"]
                else:
                    token_id = market["token_down"]

                # Market prices from discovery
                market_prices = market.get("prices", [])
                if market_prices and len(market_prices) >= 2:
                    if direction == "up":
                        current_price = float(market_prices[0])
                    else:
                        current_price = float(market_prices[1])
                else:
                    current_price = 0.50

                # Don't overpay
                price = min(current_price + 0.01, CONFIG["max_price"])
                price = round(price, 2)

                # Position size based on confidence
                if score >= CONFIG["strong_signal_score"]:
                    amount = CONFIG["max_trade"]
                elif score >= 0.50:
                    amount = CONFIG["trade_amount"]
                else:
                    amount = CONFIG["min_trade"]

                log.info("📊 %s: %s %s @ $%.2f ($%.2f) | %s",
                         coin.upper(), direction.upper(), market["title"], price, amount, market["slug"])

                # Place order
                order_id = place_trade(client, token_id, amount, price)
                if order_id:
                    traded_windows.setdefault(coin, set()).add(window_key)
                    daily_trades += 1

                    trade_entry = {
                        "ts": datetime.now(timezone.utc).isoformat(),
                        "coin": coin,
                        "direction": direction,
                        "window": ws,
                        "price": price,
                        "amount": amount,
                        "score": score,
                        "order_id": order_id,
                        "details": details,
                        "market": market["title"],
                    }
                    log_trade(trade_entry)

                    # Check fill after timeout
                    time.sleep(CONFIG["fill_timeout"])
                    filled, cost = check_fill(client, order_id)
                    if filled:
                        log.info("✅ %s %s FILLED ($%.2f)", coin.upper(), direction.upper(), cost)
                    else:
                        log.info("⏳ %s %s order still open or partially filled", coin.upper(), direction.upper())
                        # Cancel unfilled portion
                        try:
                            client.cancel(order_id)
                            log.info("Cancelled unfilled order %s", order_id[:20])
                        except:
                            pass

                    state["daily_trades"] = daily_trades
                    state["daily_pnl"] = daily_pnl
                    save_state(state)

            # Sleep between checks
            time.sleep(CONFIG["poll_interval"])

        except KeyboardInterrupt:
            break
        except Exception as e:
            log.error("Main loop error: %s", e, exc_info=True)
            time.sleep(30)

    log.info("Shutting down. Daily trades: %d, Daily PnL: $%.2f", daily_trades, daily_pnl)
    save_state(state)


if __name__ == "__main__":
    main()
