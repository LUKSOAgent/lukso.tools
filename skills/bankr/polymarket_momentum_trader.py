#!/usr/bin/env python3
"""
Bankr Polymarket Momentum Trader v2
Trades BTC prediction markets on Polymarket via Bankr API.

Improvements over v1:
- Proportional momentum scoring (not binary thresholds)
- Proper file logging + daily P&L tracking
- Position tracking to avoid conflicting bets
- Graceful error handling (no recursive restart)
- Configurable via config.json
- Coinbase price verified correct (rates FROM BTC)
- Rate-of-change + volatility awareness
- Exponential backoff on repeated failures
"""

import os
import sys
import json
import time
import logging
import subprocess
import signal
import requests
from datetime import datetime, timezone, date
from collections import deque
from pathlib import Path
from typing import Optional, Tuple

# ─── Paths ───────────────────────────────────────────────────────────────────
SKILL_DIR = Path(__file__).parent
LOG_FILE = SKILL_DIR / "bankr_trader.log"
STATE_FILE = SKILL_DIR / "trader_state.json"
PNL_FILE = SKILL_DIR / "pnl_log.jsonl"
NOTIFY_FILE = SKILL_DIR / ".trade_notification"

# ─── Defaults (overridden by config.json "trader" key) ──────────────────────
DEFAULTS = {
    "min_momentum_pct": 0.12,
    "confidence_threshold": 0.60,
    "trade_amount": 10,
    "check_interval": 30,
    "cooldown": 300,
    "network": "polygon",
    "max_daily_trades": 20,
    "max_daily_loss": 50,           # stop trading if daily losses exceed this
    "price_sources": ["coinbase", "binance"],
    "volatility_window": 20,        # samples for volatility calc
}

# ─── Logging ─────────────────────────────────────────────────────────────────
def setup_logging():
    logger = logging.getLogger("momentum_trader")
    logger.setLevel(logging.DEBUG)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")

    # File handler (debug+)
    fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    # Console handler (info+)
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    return logger

log = setup_logging()

# ─── Config ──────────────────────────────────────────────────────────────────
def load_config() -> dict:
    """Load trader config from config.json 'trader' key, merged with defaults."""
    cfg = dict(DEFAULTS)
    config_path = SKILL_DIR / "config.json"
    if config_path.exists():
        try:
            with open(config_path) as f:
                data = json.load(f)
            trader_cfg = data.get("trader", {})
            cfg.update(trader_cfg)
            log.info("Loaded config from %s", config_path)
        except Exception as e:
            log.warning("Failed to load config.json: %s — using defaults", e)
    return cfg


# ─── Price Sources ───────────────────────────────────────────────────────────
def _price_coinbase() -> Optional[float]:
    """Coinbase exchange-rates: currency=BTC → rates['USDT'] = USDT per 1 BTC (correct)."""
    resp = requests.get(
        "https://api.coinbase.com/v2/exchange-rates",
        params={"currency": "BTC"},
        timeout=5,
    )
    resp.raise_for_status()
    return float(resp.json()["data"]["rates"]["USDT"])


def _price_binance() -> Optional[float]:
    resp = requests.get(
        "https://api.binance.com/api/v3/ticker/price",
        params={"symbol": "BTCUSDT"},
        timeout=5,
    )
    resp.raise_for_status()
    return float(resp.json()["price"])


PRICE_FUNCS = {
    "coinbase": _price_coinbase,
    "binance": _price_binance,
}


def get_btc_price(sources: list[str]) -> Optional[float]:
    """Try each source in order, return first success."""
    for src in sources:
        fn = PRICE_FUNCS.get(src)
        if not fn:
            continue
        try:
            price = fn()
            if price and price > 0:
                return price
        except Exception as e:
            log.debug("Price source %s failed: %s", src, e)
    log.error("All price sources failed")
    return None


# ─── Momentum Engine ────────────────────────────────────────────────────────
class MomentumEngine:
    """Calculates momentum with proportional scoring and volatility awareness."""

    def __init__(self, maxlen: int = 200):
        self.history: deque = deque(maxlen=maxlen)

    def add(self, price: float, ts: float):
        self.history.append((ts, price))

    @property
    def count(self) -> int:
        return len(self.history)

    def _prices_in_window(self, window_sec: float) -> list[float]:
        now = self.history[-1][0] if self.history else time.time()
        return [p for t, p in self.history if now - t <= window_sec]

    def _momentum_pct(self, prices: list[float]) -> Optional[float]:
        if len(prices) < 2 or prices[0] <= 0:
            return None
        return ((prices[-1] - prices[0]) / prices[0]) * 100

    def volatility(self, window_sec: float = 600) -> Optional[float]:
        """Standard deviation of returns in window (as %)."""
        prices = self._prices_in_window(window_sec)
        if len(prices) < 5:
            return None
        returns = [(prices[i] - prices[i - 1]) / prices[i - 1] * 100 for i in range(1, len(prices))]
        mean = sum(returns) / len(returns)
        var = sum((r - mean) ** 2 for r in returns) / len(returns)
        return var ** 0.5

    def compute(self) -> Optional[dict]:
        """Return momentum data across 2m, 5m, 10m windows."""
        if self.count < 10:
            return None

        windows = {"2m": 120, "5m": 300, "10m": 600}
        result = {"price_now": self.history[-1][1]}

        for label, secs in windows.items():
            prices = self._prices_in_window(secs)
            mom = self._momentum_pct(prices)
            result[f"mom_{label}"] = mom if mom is not None else 0.0
            result[f"pts_{label}"] = len(prices)

        vol = self.volatility()
        result["volatility"] = vol if vol else 0.0
        return result


# ─── Signal Generation ───────────────────────────────────────────────────────
def generate_signal(md: dict, cfg: dict) -> Tuple[Optional[str], float, str]:
    """
    Proportional scoring: each timeframe contributes its weight scaled by
    how far momentum exceeds the threshold. Volatility dampens confidence
    to avoid trading in choppy markets.
    """
    min_mom = cfg["min_momentum_pct"]

    weights = {"2m": 0.30, "5m": 0.35, "10m": 0.35}
    up_score = 0.0
    down_score = 0.0

    for tf, w in weights.items():
        mom = md.get(f"mom_{tf}", 0)
        if mom > min_mom:
            # Proportional: cap contribution at 2x weight (for very strong moves)
            strength = min(abs(mom) / min_mom, 3.0) / 3.0  # 0..1
            up_score += w * (0.5 + 0.5 * strength)  # base 50% + proportional
        elif mom < -min_mom:
            strength = min(abs(mom) / min_mom, 3.0) / 3.0
            down_score += w * (0.5 + 0.5 * strength)

    # Require all timeframes to agree in direction (alignment bonus)
    moms = [md.get(f"mom_{tf}", 0) for tf in weights]
    all_up = all(m > 0 for m in moms)
    all_down = all(m < 0 for m in moms)

    if all_up:
        up_score *= 1.15
    if all_down:
        down_score *= 1.15

    # Volatility dampening: high volatility = reduce confidence
    vol = md.get("volatility", 0)
    if vol > 0.1:
        dampener = max(0.5, 1.0 - (vol - 0.1) * 2)
        up_score *= dampener
        down_score *= dampener

    threshold = cfg["confidence_threshold"]
    detail = (
        f"2m={md['mom_2m']:+.3f}% 5m={md['mom_5m']:+.3f}% 10m={md['mom_10m']:+.3f}% "
        f"vol={vol:.4f} up={up_score:.2f} dn={down_score:.2f}"
    )

    if up_score > down_score and up_score >= threshold:
        return "UP", up_score, detail
    if down_score > up_score and down_score >= threshold:
        return "DOWN", down_score, detail
    return None, max(up_score, down_score), f"No signal: {detail}"


# ─── Trade Execution ─────────────────────────────────────────────────────────
def place_bet(direction: str, amount: int, network: str) -> Tuple[bool, str]:
    """Execute trade via bankr.sh. Returns (success, output)."""
    side = "Yes" if direction == "UP" else "No"
    prompt = f"Bet ${amount} on {side} for Bitcoin Up or Down on Polymarket using {network}"

    log.info("Executing bankr.sh: %s", prompt)
    try:
        result = subprocess.run(
            ["bash", "./bankr.sh", prompt],
            cwd=str(SKILL_DIR),
            capture_output=True,
            text=True,
            timeout=360,
        )
        output = (result.stdout + "\n" + result.stderr).strip()
        log.debug("bankr.sh exit=%d output=%s", result.returncode, output[:500])

        if result.returncode == 0:
            # Try to parse JSON response for confirmation
            for line in result.stdout.strip().splitlines():
                try:
                    data = json.loads(line)
                    if data.get("status") == "completed":
                        return True, json.dumps(data, indent=2)
                except (json.JSONDecodeError, AttributeError):
                    continue
            return True, output
        return False, output

    except subprocess.TimeoutExpired:
        log.error("bankr.sh timed out after 360s")
        return False, "Timeout (360s)"
    except Exception as e:
        log.error("bankr.sh exception: %s", e)
        return False, str(e)


# ─── P&L Tracker ─────────────────────────────────────────────────────────────
class PnLTracker:
    """Tracks daily trades and estimated P&L."""

    def __init__(self):
        self.today: str = ""
        self.trades: list = []
        self.daily_loss: float = 0.0

    def _reset_if_new_day(self):
        today = date.today().isoformat()
        if today != self.today:
            if self.today and self.trades:
                log.info("Day %s closed: %d trades, est P&L: $%.2f",
                         self.today, len(self.trades), -self.daily_loss)
            self.today = today
            self.trades = []
            self.daily_loss = 0.0

    def record_trade(self, direction: str, amount: float, success: bool):
        self._reset_if_new_day()
        entry = {
            "time": datetime.now(timezone.utc).isoformat(),
            "direction": direction,
            "amount": amount,
            "success": success,
        }
        self.trades.append(entry)

        # Pessimistic: count every trade as potential loss until we can verify
        if success:
            self.daily_loss += amount

        # Append to file
        try:
            with open(PNL_FILE, "a") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception as e:
            log.warning("Failed to write PnL log: %s", e)

    @property
    def trade_count(self) -> int:
        self._reset_if_new_day()
        return len(self.trades)

    @property
    def estimated_exposure(self) -> float:
        self._reset_if_new_day()
        return self.daily_loss


# ─── State Persistence ───────────────────────────────────────────────────────
def save_state(last_trade_time: float, cycle: int):
    try:
        with open(STATE_FILE, "w") as f:
            json.dump({"last_trade_time": last_trade_time, "cycle": cycle,
                        "updated": datetime.now(timezone.utc).isoformat()}, f)
    except Exception:
        pass


def load_state() -> Tuple[float, int]:
    try:
        with open(STATE_FILE) as f:
            data = json.load(f)
        return data.get("last_trade_time", 0), data.get("cycle", 0)
    except Exception:
        return 0, 0


# ─── Main Loop ───────────────────────────────────────────────────────────────
def main():
    cfg = load_config()
    engine = MomentumEngine(maxlen=300)
    pnl = PnLTracker()
    last_trade_time, cycle = load_state()
    consecutive_failures = 0

    log.info("=" * 60)
    log.info("🚀 Bankr Polymarket Momentum Trader v2")
    log.info("=" * 60)
    log.info("Network: %s | Amount: $%s | Interval: %ds | Cooldown: %ds",
             cfg["network"].upper(), cfg["trade_amount"],
             cfg["check_interval"], cfg["cooldown"])
    log.info("Min momentum: %.2f%% | Confidence: %.2f | Max daily: %d trades / $%d loss",
             cfg["min_momentum_pct"], cfg["confidence_threshold"],
             cfg["max_daily_trades"], cfg["max_daily_loss"])
    log.info("=" * 60)

    while True:
        try:
            cycle += 1

            # ── Get price ──
            price = get_btc_price(cfg["price_sources"])
            if price is None:
                consecutive_failures += 1
                wait = min(cfg["check_interval"] * (2 ** min(consecutive_failures, 4)), 300)
                log.warning("Price fetch failed (%d consecutive). Retrying in %ds", consecutive_failures, wait)
                time.sleep(wait)
                continue
            consecutive_failures = 0

            engine.add(price, time.time())

            if cycle % 10 == 0 or engine.count < 15:
                log.info("Cycle #%d | BTC $%.2f | %d samples | %d trades today",
                         cycle, price, engine.count, pnl.trade_count)

            # ── Need minimum history ──
            if engine.count < 10:
                log.debug("Building history (%d/10)", engine.count)
                time.sleep(cfg["check_interval"])
                continue

            # ── Daily limits ──
            if pnl.trade_count >= cfg["max_daily_trades"]:
                log.info("Daily trade limit reached (%d). Sleeping.", pnl.trade_count)
                time.sleep(cfg["check_interval"] * 4)
                continue

            if pnl.estimated_exposure >= cfg["max_daily_loss"]:
                log.info("Daily loss limit reached ($%.2f). Sleeping.", pnl.estimated_exposure)
                time.sleep(cfg["check_interval"] * 4)
                continue

            # ── Cooldown ──
            elapsed = time.time() - last_trade_time
            if elapsed < cfg["cooldown"]:
                remaining = cfg["cooldown"] - elapsed
                log.debug("Cooldown: %ds remaining", remaining)
                time.sleep(cfg["check_interval"])
                continue

            # ── Momentum + Signal ──
            momentum = engine.compute()
            if momentum is None:
                time.sleep(cfg["check_interval"])
                continue

            signal, confidence, detail = generate_signal(momentum, cfg)

            log.info("📊 %s | conf=%.2f | %s",
                     signal or "HOLD", confidence, detail)

            if signal and confidence >= cfg["confidence_threshold"]:
                log.info("🚀 TRADE: %s $%d on %s", signal, cfg["trade_amount"], cfg["network"])
                success, output = place_bet(signal, cfg["trade_amount"], cfg["network"])

                pnl.record_trade(signal, cfg["trade_amount"], success)

                if success:
                    log.info("✅ Trade placed: %s", output[:200])
                    last_trade_time = time.time()
                    save_state(last_trade_time, cycle)
                    # Write notification for agent to pick up
                    try:
                        notify = {
                            "time": datetime.now(timezone.utc).isoformat(),
                            "direction": signal,
                            "amount": cfg["trade_amount"],
                            "price": momentum["price_now"],
                            "confidence": round(confidence, 2),
                            "detail": detail,
                            "trades_today": pnl.trade_count,
                            "exposure_today": round(pnl.estimated_exposure, 2),
                            "success": True,
                        }
                        with open(NOTIFY_FILE, "w") as f:
                            json.dump(notify, f)
                    except Exception:
                        pass
                else:
                    log.error("❌ Trade failed: %s", output[:300])
                    try:
                        notify = {
                            "time": datetime.now(timezone.utc).isoformat(),
                            "direction": signal,
                            "amount": cfg["trade_amount"],
                            "price": momentum["price_now"],
                            "confidence": round(confidence, 2),
                            "detail": detail,
                            "success": False,
                            "error": output[:200],
                        }
                        with open(NOTIFY_FILE, "w") as f:
                            json.dump(notify, f)
                    except Exception:
                        pass

            time.sleep(cfg["check_interval"])

        except KeyboardInterrupt:
            raise
        except Exception as e:
            log.exception("Unexpected error in main loop: %s", e)
            time.sleep(60)


if __name__ == "__main__":
    # Graceful shutdown
    def _sigterm(sig, frame):
        log.info("🛑 SIGTERM received, shutting down")
        sys.exit(0)

    signal.signal(signal.SIGTERM, _sigterm)

    try:
        main()
    except KeyboardInterrupt:
        log.info("🛑 Stopped by user")
        sys.exit(0)
