#!/usr/bin/env python3
"""
Weather Temperature Market Trader — Polymarket CLOB
Places trades on temperature prediction markets based on forecast consensus.

Strategy: Buy YES on the bucket that weather models agree on.
Edge: NOAA + Open-Meteo multi-model ensemble vs retail-mispriced Polymarket buckets.
"""

import os
import sys
import json
import time
import logging
import requests
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, List, Tuple

from py_clob_client.client import ClobClient
from py_clob_client.clob_types import ApiCreds, OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY

# ─── Paths ───────────────────────────────────────────────────────────────────
SKILL_DIR = Path(__file__).parent
LOG_FILE = SKILL_DIR / "weather_trader.log"
PNL_FILE = SKILL_DIR / "weather_pnl.jsonl"
NOTIFY_FILE = SKILL_DIR / ".trade_notification"

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
    logger = logging.getLogger("weather_trader")
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

# ─── CLOB Client ─────────────────────────────────────────────────────────────
def create_client() -> ClobClient:
    return ClobClient(
        "https://clob.polymarket.com",
        key=WALLET_KEY,
        chain_id=137,
        creds=CLOB_CREDS,
    )

# ─── Forecast Functions ──────────────────────────────────────────────────────

CITIES = {
    "nyc": {
        "name": "New York City",
        "lat": 40.7128, "lon": -74.006,
        "tz": "America/New_York",
        "unit": "fahrenheit",
        "noaa_grid": "OKX/33,37",
    },
    "seoul": {
        "name": "Seoul",
        "lat": 37.5665, "lon": 126.978,
        "tz": "Asia/Seoul",
        "unit": "celsius",
        "noaa_grid": None,  # NOAA only covers US
    },
    "london": {
        "name": "London",
        "lat": 51.5074, "lon": -0.1278,
        "tz": "Europe/London",
        "unit": "celsius",
        "noaa_grid": None,
    },
    "atlanta": {
        "name": "Atlanta",
        "lat": 33.749, "lon": -84.388,
        "tz": "America/New_York",
        "unit": "fahrenheit",
        "noaa_grid": "FFC/52,88",
    },
    "paris": {
        "name": "Paris",
        "lat": 48.8566, "lon": 2.3522,
        "tz": "Europe/Paris",
        "unit": "celsius",
        "noaa_grid": None,
    },
}

MODELS = ["gfs_seamless", "icon_seamless", "ecmwf_ifs025", "jma_seamless"]


def get_multi_model_forecast(city_key: str, target_date: str) -> Dict[str, float]:
    """Get max temperature forecasts from multiple models for a given date."""
    city = CITIES[city_key]
    unit_param = "&temperature_unit=fahrenheit" if city["unit"] == "fahrenheit" else ""
    
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={city['lat']}&longitude={city['lon']}"
        f"&hourly=temperature_2m"
        f"&models={','.join(MODELS)}"
        f"&timezone={city['tz']}"
        f"&forecast_days=5"
        f"{unit_param}"
    )
    
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    d = r.json()
    
    results = {}
    for model in MODELS:
        key = f"temperature_2m_{model}"
        if key in d.get("hourly", {}):
            temps = [
                t for i, t in enumerate(d["hourly"][key])
                if target_date in d["hourly"]["time"][i] and t is not None
            ]
            if temps:
                results[model] = max(temps)
    
    return results


def get_noaa_forecast(city_key: str, target_date: str) -> Optional[float]:
    """Get NOAA forecast for US cities."""
    city = CITIES[city_key]
    if not city["noaa_grid"]:
        return None
    
    try:
        url = f"https://api.weather.gov/gridpoints/{city['noaa_grid']}/forecast"
        r = requests.get(url, timeout=10, headers={"User-Agent": "weather-trader-bot"})
        r.raise_for_status()
        periods = r.json()["properties"]["periods"]
        
        # Find the daytime period for target date
        for p in periods:
            if p.get("isDaytime", False):
                start = p.get("startTime", "")
                if target_date in start:
                    return float(p["temperature"])
        
        return None
    except Exception as e:
        log.warning("NOAA forecast failed: %s", e)
        return None


def estimate_bucket_probability(forecasts: Dict[str, float], bucket_low: float, bucket_high: float) -> float:
    """
    Estimate probability that actual max temp falls in [bucket_low, bucket_high].
    Uses model spread as a simple ensemble with error distribution.
    """
    import math
    
    if not forecasts:
        return 0.0
    
    values = list(forecasts.values())
    mean = sum(values) / len(values)
    
    # Standard deviation of models (captures inter-model uncertainty)
    if len(values) > 1:
        variance = sum((v - mean) ** 2 for v in values) / (len(values) - 1)
        model_std = math.sqrt(variance)
    else:
        model_std = 1.5  # default uncertainty
    
    # Add inherent forecast error (typically 1-2°F for next-day)
    # Use Fahrenheit scale; convert if Celsius
    total_std = math.sqrt(model_std ** 2 + 1.5 ** 2)  # 1.5 base error
    
    # CDF approximation using error function
    def normal_cdf(x, mu, sigma):
        return 0.5 * (1 + math.erf((x - mu) / (sigma * math.sqrt(2))))
    
    prob = normal_cdf(bucket_high + 0.5, mean, total_std) - normal_cdf(bucket_low - 0.5, mean, total_std)
    return max(0.0, min(1.0, prob))


# ─── Market Functions ────────────────────────────────────────────────────────

def get_weather_markets() -> List[Dict]:
    """Fetch all active temperature markets from Gamma API."""
    url = "https://gamma-api.polymarket.com/events?active=true&closed=false&limit=200&order=volume24hr&ascending=false"
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    events = r.json()
    return [e for e in events if "temperature" in e.get("title", "").lower()]


def parse_bucket(question: str, unit: str) -> Optional[Tuple[float, float]]:
    """Parse temperature bucket from market question."""
    import re
    
    q = question.lower()
    
    # "between X-Y°F" pattern
    m = re.search(r"between\s+(\d+)[–-](\d+)", q)
    if m:
        return float(m.group(1)), float(m.group(2))
    
    # "be X°C" exact pattern
    m = re.search(r"be\s+(\d+)°", q)
    if m:
        val = float(m.group(1))
        return val, val
    
    # "X°C or below" pattern
    m = re.search(r"(\d+)°[cf]\s+or\s+below", q)
    if m:
        return -999, float(m.group(1))
    
    # "X°C or higher" / "X°F or higher"
    m = re.search(r"(\d+)°[cf]?\s+or\s+higher", q)
    if m:
        return float(m.group(1)), 999
    
    return None


def find_trades(min_edge: float = 0.10) -> List[Dict]:
    """
    Find all weather trades with edge > min_edge.
    Returns list of trade opportunities sorted by edge.
    """
    markets = get_weather_markets()
    trades = []
    
    for event in markets:
        title = event.get("title", "")
        
        # Determine city and date from title
        city_key = None
        for key, city in CITIES.items():
            if city["name"].lower() in title.lower():
                city_key = key
                break
        
        if not city_key:
            log.debug("Skipping unknown city: %s", title)
            continue
        
        # Extract date from title
        import re
        date_match = re.search(r"february\s+(\d+)", title.lower())
        if not date_match:
            continue
        day = int(date_match.group(1))
        target_date = f"2026-02-{day:02d}"
        
        # Get forecasts
        forecasts = get_multi_model_forecast(city_key, target_date)
        noaa = get_noaa_forecast(city_key, target_date)
        if noaa is not None:
            forecasts["noaa"] = noaa
        
        if not forecasts:
            log.warning("No forecasts for %s %s", city_key, target_date)
            continue
        
        values = list(forecasts.values())
        mean_forecast = sum(values) / len(values)
        log.info("%s %s — Forecasts: %s (mean=%.1f)", 
                 city_key.upper(), target_date,
                 {k: f"{v:.1f}" for k, v in forecasts.items()},
                 mean_forecast)
        
        unit = CITIES[city_key]["unit"]
        
        # Evaluate each market bucket
        for mkt in event.get("markets", []):
            if mkt.get("closed", False):
                continue
            
            question = mkt.get("question", "")
            prices_raw = mkt.get("outcomePrices", "[]")
            prices = json.loads(prices_raw) if isinstance(prices_raw, str) else prices_raw
            
            if not prices or len(prices) < 2:
                continue
            
            yes_price = float(prices[0])
            no_price = float(prices[1])
            
            # Skip illiquid / near-resolved markets
            if yes_price < 0.01 or yes_price > 0.99:
                continue
            
            bucket = parse_bucket(question, unit)
            if not bucket:
                log.debug("Couldn't parse bucket: %s", question)
                continue
            
            bucket_low, bucket_high = bucket
            
            # Estimate true probability
            est_prob = estimate_bucket_probability(forecasts, bucket_low, bucket_high)
            
            # Calculate edge for YES and NO
            yes_edge = est_prob - yes_price
            no_edge = (1 - est_prob) - no_price
            
            # Token IDs
            token_ids_raw = mkt.get("clobTokenIds", "[]")
            token_ids = json.loads(token_ids_raw) if isinstance(token_ids_raw, str) else token_ids_raw
            
            if yes_edge >= min_edge:
                trades.append({
                    "event": title,
                    "question": question,
                    "side": "YES",
                    "price": yes_price,
                    "est_prob": est_prob,
                    "edge": yes_edge,
                    "token_id": token_ids[0] if token_ids else None,
                    "condition_id": mkt.get("conditionId", ""),
                    "forecasts": forecasts,
                    "bucket": (bucket_low, bucket_high),
                    "city": city_key,
                    "date": target_date,
                })
            
            if no_edge >= min_edge:
                trades.append({
                    "event": title,
                    "question": question,
                    "side": "NO",
                    "price": no_price,
                    "est_prob": 1 - est_prob,
                    "edge": no_edge,
                    "token_id": token_ids[1] if len(token_ids) > 1 else None,
                    "condition_id": mkt.get("conditionId", ""),
                    "forecasts": forecasts,
                    "bucket": (bucket_low, bucket_high),
                    "city": city_key,
                    "date": target_date,
                })
    
    # Sort by edge (highest first)
    trades.sort(key=lambda t: t["edge"], reverse=True)
    return trades


def place_trade(client: ClobClient, trade: Dict, amount_usd: float) -> Optional[Dict]:
    """Place a CLOB limit order for the trade."""
    token_id = trade["token_id"]
    price = trade["price"]
    side = trade["side"]
    
    if not token_id:
        log.error("No token ID for trade: %s", trade["question"])
        return None
    
    # Calculate size: amount_usd / price = number of shares
    size = round(amount_usd / price, 2)
    
    log.info("Placing %s order: %s @ $%.3f (size=%.2f shares, cost=$%.2f)",
             side, trade["question"][:60], price, size, amount_usd)
    log.info("  Edge: %.1f%% | Est prob: %.1f%% | Market price: %.1f%%",
             trade["edge"] * 100, trade["est_prob"] * 100, price * 100)
    
    try:
        order_args = OrderArgs(
            price=price,
            size=size,
            side=BUY,
            token_id=token_id,
        )
        
        signed_order = client.create_order(order_args)
        resp = client.post_order(signed_order, OrderType.GTC)
        
        log.info("Order placed: %s", resp)
        
        # Log to PNL file
        entry = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "event": trade["event"],
            "question": trade["question"],
            "side": side,
            "price": price,
            "size": size,
            "cost_usd": amount_usd,
            "est_prob": trade["est_prob"],
            "edge": trade["edge"],
            "forecasts": {k: round(v, 1) for k, v in trade["forecasts"].items()},
            "bucket": trade["bucket"],
            "order_response": str(resp)[:200],
        }
        with open(PNL_FILE, "a") as f:
            f.write(json.dumps(entry) + "\n")
        
        return resp
        
    except Exception as e:
        log.error("Order failed: %s", e)
        return None


def notify(msg: str):
    """Write notification file for OpenClaw to pick up."""
    with open(NOTIFY_FILE, "w") as f:
        f.write(msg)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    log.info("=" * 60)
    log.info("Weather Trader starting")
    log.info("=" * 60)
    
    # Config
    TOTAL_BANKROLL = 68.0  # USDC available
    MAX_PER_TRADE = 25.0   # max per single trade
    MIN_EDGE = 0.08        # minimum 8% edge to trade
    MAX_TRADES = 4          # max number of trades
    
    # Find opportunities
    log.info("Scanning weather markets for opportunities (min edge: %.0f%%)...", MIN_EDGE * 100)
    trades = find_trades(min_edge=MIN_EDGE)
    
    if not trades:
        log.info("No trades found with sufficient edge. Exiting.")
        return
    
    log.info("Found %d opportunities:", len(trades))
    for i, t in enumerate(trades):
        log.info("  [%d] %s %s @ $%.3f | Edge: %.1f%% | Est: %.1f%%",
                 i + 1, t["side"], t["question"][:50], t["price"],
                 t["edge"] * 100, t["est_prob"] * 100)
    
    # Select trades: top N by edge, diversify across events
    selected = []
    seen_events = set()
    remaining = TOTAL_BANKROLL
    
    for trade in trades:
        if len(selected) >= MAX_TRADES:
            break
        if remaining < 5:
            break
        
        # Kelly criterion sizing (half-Kelly for safety)
        edge = trade["edge"]
        odds = (1 / trade["price"]) - 1  # decimal odds minus 1
        kelly_fraction = edge / (1 - trade["price"]) if trade["price"] < 1 else 0
        half_kelly = kelly_fraction / 2
        
        amount = min(
            MAX_PER_TRADE,
            remaining * half_kelly,
            remaining * 0.4,  # never more than 40% of remaining on one trade
        )
        amount = max(5.0, round(amount, 2))  # minimum $5
        
        if amount > remaining:
            amount = remaining
        
        trade["amount"] = amount
        selected.append(trade)
        remaining -= amount
        seen_events.add(trade["event"])
    
    # Confirm and execute
    log.info("\n--- TRADE PLAN ---")
    total_cost = 0
    for t in selected:
        log.info("%s %s: $%.2f @ $%.3f | Edge %.1f%% | Payout if win: $%.2f",
                 t["side"], t["question"][:50], t["amount"], t["price"],
                 t["edge"] * 100, t["amount"] / t["price"])
        total_cost += t["amount"]
    log.info("Total cost: $%.2f / $%.2f available", total_cost, TOTAL_BANKROLL)
    log.info("---\n")
    
    # Create client and place trades
    client = create_client()
    
    results = []
    for trade in selected:
        resp = place_trade(client, trade, trade["amount"])
        if resp:
            results.append((trade, resp))
            time.sleep(2)  # brief pause between orders
    
    # Summary
    log.info("\n=== EXECUTION SUMMARY ===")
    log.info("Trades placed: %d / %d planned", len(results), len(selected))
    for trade, resp in results:
        log.info("  ✓ %s %s @ $%.3f ($%.2f)", 
                 trade["side"], trade["question"][:40], trade["price"], trade["amount"])
    
    if results:
        notify_msg = f"Weather trades placed: {len(results)} orders, ${total_cost:.2f} total"
        for trade, _ in results:
            notify_msg += f"\n• {trade['side']} {trade['question'][:50]} @ ${trade['price']:.3f}"
        notify(notify_msg)
    
    log.info("Done.")


if __name__ == "__main__":
    main()
