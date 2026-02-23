#!/usr/bin/env python3
"""
Simmer FastLoop Trading Skill

Trades Polymarket BTC 5-minute fast markets using CEX price momentum.
Default signal: Binance BTCUSDT candles. Agents can customize signal source.

Usage:
    python fast_trader.py              # Dry run (show opportunities, no trades)
    python fast_trader.py --live       # Execute real trades
    python fast_trader.py --positions  # Show current fast market positions
    python fast_trader.py --quiet      # Only output on trades/errors

Requires:
    SIMMER_API_KEY environment variable (get from simmer.markets/dashboard)
"""

import os
import sys
import json
import math
import time
import argparse
import hashlib
from datetime import datetime, timezone, timedelta
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, quote

# Optional: Web3 for local signing
try:
    from eth_account import Account
    from eth_abi.packed import encode_packed
    WEB3_AVAILABLE = True
except ImportError:
    WEB3_AVAILABLE = False
    Account = None

# Force line-buffered stdout for non-TTY environments (cron, Docker, OpenClaw)
sys.stdout.reconfigure(line_buffering=True)

# Optional: Trade Journal integration
try:
    from tradejournal import log_trade
    JOURNAL_AVAILABLE = True
except ImportError:
    try:
        from skills.tradejournal import log_trade
        JOURNAL_AVAILABLE = True
    except ImportError:
        JOURNAL_AVAILABLE = False
        def log_trade(*args, **kwargs):
            pass

# =============================================================================
# Configuration (config.json > env vars > defaults)
# =============================================================================

CONFIG_SCHEMA = {
    "entry_threshold": {"default": 0.05, "env": "SIMMER_SPRINT_ENTRY", "type": float,
                        "help": "Min price divergence from 50¢ to trigger trade"},
    "min_momentum_pct": {"default": 0.5, "env": "SIMMER_SPRINT_MOMENTUM", "type": float,
                         "help": "Min BTC % move in lookback window to trigger"},
    "max_position": {"default": 5.0, "env": "SIMMER_SPRINT_MAX_POSITION", "type": float,
                     "help": "Max $ per trade"},
    "signal_source": {"default": "binance", "env": "SIMMER_SPRINT_SIGNAL", "type": str,
                      "help": "Price feed source (binance, chainlink, coingecko). Binance = best for momentum"},
    "lookback_minutes": {"default": 5, "env": "SIMMER_SPRINT_LOOKBACK", "type": int,
                         "help": "Minutes of price history for momentum calc"},
    "min_time_remaining": {"default": 60, "env": "SIMMER_SPRINT_MIN_TIME", "type": int,
                           "help": "Skip fast_markets with less than this many seconds remaining"},
    "asset": {"default": "BTC", "env": "SIMMER_SPRINT_ASSET", "type": str,
              "help": "Asset to trade (BTC, ETH, SOL)"},
    "window": {"default": "5m", "env": "SIMMER_SPRINT_WINDOW", "type": str,
               "help": "Market window duration (5m or 15m)"},
    "volume_confidence": {"default": True, "env": "SIMMER_SPRINT_VOL_CONF", "type": bool,
                          "help": "Weight signal by volume (higher volume = more confident)"},
    "daily_budget": {"default": 10.0, "env": "SIMMER_SPRINT_DAILY_BUDGET", "type": float,
                     "help": "Max total spend per UTC day"},
    "use_trend_confirmation": {"default": True, "env": "SIMMER_SPRINT_TREND", "type": bool,
                               "help": "Require trend confirmation from multiple timeframes"},
    "confidence_threshold": {"default": 0.55, "env": "SIMMER_SPRINT_CONF", "type": float,
                             "help": "Minimum win probability to trade (0.50-0.80)"},
}

TRADE_SOURCE = "sdk:fastloop"
SMART_SIZING_PCT = 0.05  # 5% of balance per trade
MIN_SHARES_PER_ORDER = 5  # Polymarket minimum

# Asset → Binance symbol mapping
ASSET_SYMBOLS = {
    "BTC": "BTCUSDT",
    "ETH": "ETHUSDT",
    "SOL": "SOLUSDT",
}

# Asset → Gamma API search patterns
ASSET_PATTERNS = {
    "BTC": ["bitcoin up or down"],
    "ETH": ["ethereum up or down"],
    "SOL": ["solana up or down"],
}


def _load_config(schema, skill_file, config_filename="config.json"):
    """Load config with priority: config.json > env vars > defaults."""
    from pathlib import Path
    config_path = Path(skill_file).parent / config_filename
    file_cfg = {}
    if config_path.exists():
        try:
            with open(config_path) as f:
                file_cfg = json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    result = {}
    for key, spec in schema.items():
        if key in file_cfg:
            result[key] = file_cfg[key]
        elif spec.get("env") and os.environ.get(spec["env"]):
            val = os.environ.get(spec["env"])
            type_fn = spec.get("type", str)
            try:
                if type_fn == bool:
                    result[key] = val.lower() in ("true", "1", "yes")
                else:
                    result[key] = type_fn(val)
            except (ValueError, TypeError):
                result[key] = spec.get("default")
        else:
            result[key] = spec.get("default")
    return result


def _get_config_path(skill_file, config_filename="config.json"):
    from pathlib import Path
    return Path(skill_file).parent / config_filename


def _update_config(updates, skill_file, config_filename="config.json"):
    """Update config.json with new values."""
    from pathlib import Path
    config_path = Path(skill_file).parent / config_filename
    existing = {}
    if config_path.exists():
        try:
            with open(config_path) as f:
                existing = json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    existing.update(updates)
    with open(config_path, "w") as f:
        json.dump(existing, f, indent=2)
    return existing


# Load config
cfg = _load_config(CONFIG_SCHEMA, __file__)
ENTRY_THRESHOLD = cfg["entry_threshold"]
MIN_MOMENTUM_PCT = cfg["min_momentum_pct"]
MAX_POSITION_USD = cfg["max_position"]
SIGNAL_SOURCE = cfg["signal_source"]
LOOKBACK_MINUTES = cfg["lookback_minutes"]
MIN_TIME_REMAINING = cfg["min_time_remaining"]
ASSET = cfg["asset"].upper()
WINDOW = cfg["window"]  # "5m" or "15m"
VOLUME_CONFIDENCE = cfg["volume_confidence"]
DAILY_BUDGET = cfg["daily_budget"]
USE_TREND_CONFIRMATION = cfg.get("use_trend_confirmation", True)
CONFIDENCE_THRESHOLD = cfg.get("confidence_threshold", 0.55)


# =============================================================================
# Daily Budget Tracking
# =============================================================================

def _get_spend_path(skill_file):
    from pathlib import Path
    return Path(skill_file).parent / "daily_spend.json"


def _load_daily_spend(skill_file):
    """Load today's spend. Resets if date != today (UTC)."""
    spend_path = _get_spend_path(skill_file)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if spend_path.exists():
        try:
            with open(spend_path) as f:
                data = json.load(f)
            if data.get("date") == today:
                return data
        except (json.JSONDecodeError, IOError):
            pass
    return {"date": today, "spent": 0.0, "trades": 0}


def _save_daily_spend(skill_file, spend_data):
    """Save daily spend to file."""
    spend_path = _get_spend_path(skill_file)
    with open(spend_path, "w") as f:
        json.dump(spend_data, f, indent=2)


# =============================================================================
# API Helpers
# =============================================================================

SIMMER_BASE = os.environ.get("SIMMER_API_BASE", "https://api.simmer.markets")


def get_api_key():
    key = os.environ.get("SIMMER_API_KEY")
    if not key:
        print("Error: SIMMER_API_KEY environment variable not set")
        print("Get your API key from: simmer.markets/dashboard → SDK tab")
        sys.exit(1)
    return key


def get_private_key():
    """Get private key from environment for local signing.
    
    Checks WALLET_PRIVATE_KEY (Simmer SDK standard) first, then POLYGON_PRIVATE_KEY.
    """
    # Simmer SDK uses WALLET_PRIVATE_KEY
    key = os.environ.get("WALLET_PRIVATE_KEY") or os.environ.get("POLYGON_PRIVATE_KEY")
    if not key:
        # Try to load from .credentials file
        cred_path = os.path.expanduser("~/.openclaw/workspace/.credentials")
        if os.path.exists(cred_path):
            try:
                with open(cred_path) as f:
                    content = f.read()
                    # Look for wallet_private_key or polygon_private_key in the file
                    import re
                    match = re.search(r'["\']?(0x[a-fA-F0-9]{64})["\']?', content)
                    if match:
                        return match.group(1)
            except Exception:
                pass
    return key


def link_wallet_to_simmer(api_key, private_key):
    """Link wallet to Simmer account (one-time setup).
    
    This must be called before trading with an external wallet.
    """
    if not WEB3_AVAILABLE or not Account:
        print("  ⚠️  Web3 not available for wallet linking")
        return False
    
    try:
        import random
        account = Account.from_key(private_key)
        address = account.address
        nonce = random.randint(1, 999999999)
        
        # Create a signed message to prove ownership
        message = f"Link wallet to Simmer: {address}"
        message_hash = hashlib.sha256(message.encode()).digest()
        
        from eth_account.messages import encode_defunct
        message_encoded = encode_defunct(primitive=message_hash)
        signed = account.sign_message(message_encoded)
        
        # Call Simmer link endpoint
        result = simmer_request("/api/sdk/wallet/link", method="POST", data={
            "address": address,
            "signature": signed.signature.hex(),
            "message": message,
            "nonce": str(nonce),  # nonce must be a string
        }, api_key=api_key)
        
        if result and result.get("success"):
            print(f"  ✅ Wallet linked: {address[:10]}...")
            return True
        elif result and "already linked" in str(result.get("error", "")).lower():
            print(f"  ✅ Wallet already linked: {address[:10]}...")
            return True
        else:
            error = result.get("error", "Unknown error") if result else "No response"
            print(f"  ⚠️  Wallet link failed: {error}")
            return False
    except Exception as e:
        print(f"  ⚠️  Wallet link error: {e}")
        return False


def sign_order_locally(market_id, side, amount, nonce, private_key):
    """Sign an order locally using the private key.
    
    Returns the signature string or None if signing fails.
    """
    if not WEB3_AVAILABLE or not Account:
        print("  ⚠️  Web3 not available for local signing")
        return None
    
    try:
        from eth_account.messages import encode_defunct
        
        # Create order hash according to Simmer/Polymarket format
        account = Account.from_key(private_key)
        
        # Format: market_id, side (0=yes, 1=no), amount, nonce
        side_int = 0 if side.lower() == "yes" else 1
        
        # Pack the data
        data = encode_packed(
            ['string', 'uint8', 'uint256', 'uint256'],
            [market_id, side_int, int(amount * 1e6), nonce]
        )
        
        # Hash and sign using sign_message
        message_hash = hashlib.sha256(data).digest()
        message = encode_defunct(primitive=message_hash)
        signed = account.sign_message(message)
        
        return signed.signature.hex()
    except Exception as e:
        print(f"  ⚠️  Signing failed: {e}")
        import traceback
        traceback.print_exc()
        return None


def _api_request(url, method="GET", data=None, headers=None, timeout=15):
    """Make an HTTP request. Returns parsed JSON or None on error."""
    try:
        req_headers = headers or {}
        if "User-Agent" not in req_headers:
            req_headers["User-Agent"] = "simmer-fastloop_market/1.0"
        body = None
        if data:
            body = json.dumps(data).encode("utf-8")
            req_headers["Content-Type"] = "application/json"
        req = Request(url, data=body, headers=req_headers, method=method)
        with urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        try:
            error_body = json.loads(e.read().decode("utf-8"))
            return {"error": error_body.get("detail", str(e)), "status_code": e.code}
        except Exception:
            return {"error": str(e), "status_code": e.code}
    except URLError as e:
        return {"error": f"Connection error: {e.reason}"}
    except Exception as e:
        return {"error": str(e)}


def simmer_request(path, method="GET", data=None, api_key=None):
    """Make a Simmer API request."""
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    return _api_request(f"{SIMMER_BASE}{path}", method=method, data=data, headers=headers)


# =============================================================================
# Sprint Market Discovery
# =============================================================================

def discover_fast_market_markets(asset="BTC", window="5m", api_key=None):
    """Find active fast markets via Simmer API (preferred) or Polymarket Gamma API.
    
    Uses Simmer first because it has imported more markets including currently active ones.
    Only returns 5-minute window markets (not 15m, 1h, 24h variants) that are currently active.
    """
    # Try Simmer SDK first (has more markets including currently active ones)
    try:
        from simmer_sdk import SimmerClient
        if api_key:
            client = SimmerClient(api_key=api_key)
        else:
            client = SimmerClient()
        
        markets_data = client.get_markets(status='active', limit=100)
        patterns = ASSET_PATTERNS.get(asset, ASSET_PATTERNS["BTC"])
        markets = []
        
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        
        for m in markets_data:
            q = m.question.lower()
            
            if not any(p in q for p in patterns):
                continue
            if 'up or down' not in q:
                continue
                
            import re
            time_match = re.search(r'(\d{1,2}):(\d{2})(AM|PM)-(\d{1,2}):(\d{2})(AM|PM)', m.question)
            if not time_match:
                continue
                
            start_h = int(time_match.group(1))
            start_m = int(time_match.group(2))
            start_ampm = time_match.group(3)
            end_h = int(time_match.group(4))
            end_m = int(time_match.group(5))
            end_ampm = time_match.group(6)
            
            def to_min(h, ampm):
                if ampm == 'PM' and h != 12: h += 12
                if ampm == 'AM' and h == 12: h = 0
                return h * 60
            
            start_tot = to_min(start_h, start_ampm) + start_m
            end_tot = to_min(end_h, end_ampm) + end_m
            if end_tot < start_tot:
                end_tot += 24 * 60
            duration = end_tot - start_tot
            
            if duration != 5:
                continue
            
            date_match = re.search(r'(\w+ \d+),', m.question)
            if not date_match:
                continue
            
            date_str = date_match.group(1)
            year = now.year
            
            try:
                start_dt_str = f"{date_str} {year} {start_h}:{start_m:02d}{start_ampm}"
                start_dt = datetime.strptime(start_dt_str, "%B %d %Y %I:%M%p")
                start_dt = start_dt.replace(tzinfo=timezone.utc) + timedelta(hours=5)
                
                end_dt_str = f"{date_str} {year} {end_h}:{end_m:02d}{end_ampm}"
                end_dt = datetime.strptime(end_dt_str, "%B %d %Y %I:%M%p")
                if end_tot < start_tot:
                    end_dt = end_dt + timedelta(days=1)
                end_dt = end_dt.replace(tzinfo=timezone.utc) + timedelta(hours=5)
            except:
                continue
            
            if now < start_dt or now > end_dt:
                continue
            
            time_remaining = (end_dt - now).total_seconds()
            if time_remaining < MIN_TIME_REMAINING:
                continue
            
            markets.append({
                "question": m.question,
                "slug": m.id,
                "condition_id": m.id,
                "end_time": end_dt,
                "outcomes": [],
                "outcome_prices": "[]",
                "fee_rate_bps": 0,
                "simmer_market_id": m.id,
            })
        
        if markets:
            return markets
    except Exception as e:
        pass  # Fall back to Gamma API
    
    # Fallback to Polymarket Gamma API
    patterns = ASSET_PATTERNS.get(asset, ASSET_PATTERNS["BTC"])
    url = (
        "https://gamma-api.polymarket.com/markets"
        "?limit=50&closed=false&tag=crypto&order=createdAt&ascending=false"
    )
    result = _api_request(url)
    if not result or isinstance(result, dict) and result.get("error"):
        return []

    markets = []
    for m in result:
        q = (m.get("question") or "").lower()
        slug = m.get("slug", "")
        
        # Check if it's a BTC up/down market
        if not any(p in q for p in patterns):
            continue
            
        # STRICT: Only accept 5-minute windows
        # Pattern: "X:XXAM-X:XXAM ET" with exactly 5 min difference
        # Example: "5:30AM-5:35AM ET" (valid 5m)
        # NOT: "8:00AM-8:15AM ET" (15m) or "8AM ET" (24h)
        import re
        time_pattern = r'(\d{1,2}):(\d{2})(AM|PM)-(\d{1,2}):(\d{2})(AM|PM)'
        match = re.search(time_pattern, m.get("question", ""))
        
        if not match:
            continue  # Skip if no time range found (e.g., 24h markets)
            
        # Parse start and end times
        start_hour = int(match.group(1))
        start_min = int(match.group(2))
        start_ampm = match.group(3)
        end_hour = int(match.group(4))
        end_min = int(match.group(5))
        end_ampm = match.group(6)
        
        # Convert to minutes for comparison
        def to_minutes(h, m, ampm):
            if ampm == "PM" and h != 12:
                h += 12
            elif ampm == "AM" and h == 12:
                h = 0
            return h * 60 + m
        
        start_total = to_minutes(start_hour, start_min, start_ampm)
        end_total = to_minutes(end_hour, end_min, end_ampm)
        
        # Handle overnight (e.g., 11:55PM-12:00AM)
        if end_total < start_total:
            end_total += 24 * 60
            
        duration_minutes = end_total - start_total
        
        # STRICT: Only accept exactly 5-minute windows
        if duration_minutes != 5:
            continue  # Skip 15m, 1h, etc.
        
        # Calculate start and end times for this market
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        
        # Parse the date from the question
        import re
        date_match = re.search(r'(\w+ \d+),', m.get("question", ""))
        if not date_match:
            continue
        
        date_str = date_match.group(1)
        year = now.year
        
        # Build start datetime
        start_dt_str = f"{date_str} {year} {start_hour}:{start_min:02d}{start_ampm}"
        try:
            start_dt = datetime.strptime(start_dt_str, "%B %d %Y %I:%M%p")
            # Convert to UTC (ET is UTC-5)
            from datetime import timedelta
            start_dt = start_dt.replace(tzinfo=timezone.utc) + timedelta(hours=5)
        except:
            continue
        
        # Build end datetime  
        end_dt_str = f"{date_str} {year} {end_hour}:{end_min:02d}{end_ampm}"
        try:
            end_dt = datetime.strptime(end_dt_str, "%B %d %Y %I:%M%p")
            # Handle overnight
            if end_total < start_total:
                end_dt = end_dt + timedelta(days=1)
            end_dt = end_dt.replace(tzinfo=timezone.utc) + timedelta(hours=5)
        except:
            continue
        
        # STRICT: Market must be currently active (started but not ended)
        if now < start_dt:
            continue  # Market hasn't started yet
        if now > end_dt:
            continue  # Market already ended
        
        # Must have enough time left to trade
        time_remaining = (end_dt - now).total_seconds()
        if time_remaining < MIN_TIME_REMAINING:
            continue  # Too close to expiry
        
        condition_id = m.get("conditionId", "")
        closed = m.get("closed", False)
        if not closed and slug:
            end_time = _parse_fast_market_end_time(m.get("question", ""))
            markets.append({
                "question": m.get("question", ""),
                "slug": slug,
                "condition_id": condition_id,
                "end_time": end_time,
                "outcomes": m.get("outcomes", []),
                "outcome_prices": m.get("outcomePrices", "[]"),
                "fee_rate_bps": int(m.get("fee_rate_bps") or m.get("feeRateBps") or 0),
            })
    return markets


def _parse_fast_market_end_time(question):
    """Parse end time from fast market question.
    e.g., 'Bitcoin Up or Down - February 15, 5:30AM-5:35AM ET' → datetime
    """
    import re
    # Match pattern: "Month Day, StartTime-EndTime ET"
    pattern = r'(\w+ \d+),.*?-\s*(\d{1,2}:\d{2}(?:AM|PM))\s*ET'
    match = re.search(pattern, question)
    if not match:
        return None
    try:
        date_str = match.group(1)
        time_str = match.group(2)
        year = datetime.now(timezone.utc).year
        dt_str = f"{date_str} {year} {time_str}"
        # Parse as ET (UTC-5)
        dt = datetime.strptime(dt_str, "%B %d %Y %I:%M%p")
        # Convert ET to UTC (+5 hours)
        dt = dt.replace(tzinfo=timezone.utc) + timedelta(hours=5)
        return dt
    except Exception:
        return None


def find_best_fast_market(markets):
    """Pick the best fast_market to trade: soonest expiring with enough time remaining."""
    now = datetime.now(timezone.utc)
    candidates = []
    for m in markets:
        end_time = m.get("end_time")
        if not end_time:
            continue
        remaining = (end_time - now).total_seconds()
        if remaining > MIN_TIME_REMAINING:
            candidates.append((remaining, m))

    if not candidates:
        return None
    # Sort by soonest expiring
    candidates.sort(key=lambda x: x[0])
    return candidates[0][1]


# =============================================================================
# CEX Price Signal
# =============================================================================

def get_binance_momentum(symbol="BTCUSDT", lookback_minutes=5):
    """Get price momentum from Binance public API.
    Returns: {momentum_pct, direction, price_now, price_then, avg_volume, candles}
    """
    # Need at least 2 candles to calculate momentum
    limit = max(lookback_minutes, 2)
    url = (
        f"https://api.binance.com/api/v3/klines"
        f"?symbol={symbol}&interval=1m&limit={limit}"
    )
    result = _api_request(url)
    if not result:
        print(f"  ⚠️  Binance API: No response")
        return None
    if isinstance(result, dict) and result.get("error"):
        print(f"  ⚠️  Binance API error: {result.get('error')}")
        return None
    if not isinstance(result, list):
        print(f"  ⚠️  Binance API: Unexpected response type {type(result)}")
        return None

    try:
        # Kline format: [open_time, open, high, low, close, volume, ...]
        candles = result
        if len(candles) < 2:
            print(f"  ⚠️  Binance API: Not enough candles ({len(candles)})")
            return None

        price_then = float(candles[0][1])   # open of oldest candle
        price_now = float(candles[-1][4])    # close of newest candle
        momentum_pct = ((price_now - price_then) / price_then) * 100
        direction = "up" if momentum_pct > 0 else "down"

        volumes = [float(c[5]) for c in candles]
        avg_volume = sum(volumes) / len(volumes)
        latest_volume = volumes[-1]

        # Volume ratio: latest vs average (>1 = above average activity)
        volume_ratio = latest_volume / avg_volume if avg_volume > 0 else 1.0

        return {
            "momentum_pct": momentum_pct,
            "direction": direction,
            "price_now": price_now,
            "price_then": price_then,
            "avg_volume": avg_volume,
            "latest_volume": latest_volume,
            "volume_ratio": volume_ratio,
            "candles": len(candles),
        }
    except (IndexError, ValueError, KeyError):
        return None


def get_coingecko_momentum(asset="bitcoin", lookback_minutes=5):
    """Fallback: get price from CoinGecko (less accurate, ~1-2 min lag)."""
    url = f"https://api.coingecko.com/api/v3/simple/price?ids={asset}&vs_currencies=usd"
    result = _api_request(url)
    if not result or isinstance(result, dict) and result.get("error"):
        return None
    price_now = result.get(asset, {}).get("usd")
    if not price_now:
        return None
    # CoinGecko doesn't give candle data on free tier, so just return current price
    # Agent would need to track history across calls for momentum
    return {
        "momentum_pct": 0,  # Can't calculate without history
        "direction": "neutral",
        "price_now": price_now,
        "price_then": price_now,
        "avg_volume": 0,
        "latest_volume": 0,
        "volume_ratio": 1.0,
        "candles": 0,
    }


COINGECKO_ASSETS = {"BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana"}

# Chainlink Price Feed addresses
# Polygon feeds update more frequently than Ethereum mainnet
CHAINLINK_FEEDS = {
    "BTC": "0xc907E116054Ad103354f2D350FD2514433D57F6f",  # BTC/USD on Polygon
    "ETH": "0xF9680D99D6C9589e2a93a78A04A279e509205945",  # ETH/USD on Polygon
}

# Polygon RPC endpoints (faster updates than Ethereum)
ETH_RPC_ENDPOINTS = [
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon",
    "https://polygon.publicnode.com",
]


def get_chainlink_price(asset="BTC"):
    """Fetch latest price directly from Chainlink oracle.
    This gives us 60-second edge over Polymarket terminal.
    Returns: {price, timestamp, round_id}
    """
    feed_address = CHAINLINK_FEEDS.get(asset)
    if not feed_address:
        return None
    
    # Chainlink AggregatorV3Interface: latestRoundData()
    # Function signature: 0xfeaf968c
    payload = {
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{
            "to": feed_address,
            "data": "0xfeaf968c"  # latestRoundData()
        }, "latest"],
        "id": 1
    }
    
    for rpc_url in ETH_RPC_ENDPOINTS:
        try:
            req = Request(
                rpc_url,
                data=json.dumps(payload).encode(),
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (compatible; OpenClaw/1.0)"
                },
                method="POST"
            )
            with urlopen(req, timeout=10) as resp:
                result = json.loads(resp.read().decode())
                
            if result.get("error"):
                continue
                
            # Decode response: (roundId, answer, startedAt, updatedAt, answeredInRound)
            # Each value is 32 bytes (64 hex chars), padded to uint256
            data = result.get("result", "")
            if len(data) < 322:  # 0x + 5 * 64 hex chars = 322 chars minimum
                continue
                
            # Remove 0x prefix
            if data.startswith("0x"):
                data = data[2:]
            
            # Split into 32-byte (64 hex char) slots
            slots = [data[i:i+64] for i in range(0, len(data), 64)]
            if len(slots) < 5:
                continue
            
            # Parse answer (2nd slot, index 1) - int256
            answer_int = int(slots[1], 16)
            # Handle negative values (int256 two's complement)
            if answer_int >= 2**255:
                answer_int = answer_int - 2**256
            
            # BTC/USD uses 8 decimals
            price = answer_int / 1e8
            
            # Parse updatedAt (4th slot, index 3) - uint256
            updated_at = int(slots[3], 16)
            
            return {
                "price": price,
                "updated_at": updated_at,
                "source": "chainlink",
                "rpc": rpc_url,
            }
        except Exception:
            continue
    
    return None


def get_chainlink_momentum(asset="BTC", lookback_minutes=5):
    """Get price momentum using Chainlink oracle price + wall-clock history.

    Chainlink BTC/USD only updates ~once per hour (or on >0.5% deviation).
    The old code keyed history on the oracle's updated_at timestamp, so
    between updates only one entry ever existed -> 0% momentum every time.

    Fix: record one data-point per bot cycle using wall-clock time so that
    momentum tracks how the oracle price evolves across cycles.  On
    cold-start (< 2 data-points) bootstrap momentum from Binance.
    """
    from pathlib import Path
    import time

    history_file = Path(__file__).parent / f"chainlink_history_{asset.lower()}.json"
    history = []
    if history_file.exists():
        try:
            with open(history_file) as f:
                history = json.load(f)
        except (json.JSONDecodeError, IOError):
            history = []

    current = get_chainlink_price(asset)
    if not current:
        return None

    price_now = current["price"]
    oracle_ts = current["updated_at"]
    wall_ts = int(time.time())

    def _wts(entry):
        """Read wall-clock ts (supports old format keyed on 'timestamp')."""
        return entry.get("wall_ts", entry.get("timestamp", 0))

    # Record every cycle using wall-clock time (skip if <30s since last)
    if not history or (wall_ts - _wts(history[-1])) >= 30:
        history.append({"price": price_now, "wall_ts": wall_ts, "oracle_ts": oracle_ts})

    # Keep last 60 minutes
    cutoff = wall_ts - 3600
    history = [h for h in history if _wts(h) >= cutoff]

    try:
        with open(history_file, "w") as f:
            json.dump(history, f, indent=2)
    except IOError:
        pass

    # Find price from lookback_minutes ago (90s tolerance for 2-min cron)
    target_ts = wall_ts - (lookback_minutes * 60)
    price_then = None
    for h in sorted(history, key=lambda x: abs(_wts(x) - target_ts)):
        if abs(_wts(h) - target_ts) < 90:
            price_then = h["price"]
            break

    # Fallback: use oldest entry if we have multiple data-points
    if price_then is None and len(history) >= 2:
        price_then = history[0]["price"]
    elif price_then is None:
        # Cold-start: bootstrap momentum from Binance
        symbol = ASSET_SYMBOLS.get(asset, "BTCUSDT")
        binance_data = get_binance_momentum(symbol, lookback_minutes)
        if binance_data:
            return {
                "momentum_pct": binance_data["momentum_pct"],
                "direction": binance_data["direction"],
                "price_now": price_now,
                "price_then": binance_data["price_then"],
                "avg_volume": binance_data["avg_volume"],
                "latest_volume": binance_data["latest_volume"],
                "volume_ratio": binance_data["volume_ratio"],
                "candles": len(history),
                "oracle_updated": oracle_ts,
                "source": "chainlink+binance-bootstrap",
            }
        price_then = price_now

    momentum_pct = ((price_now - price_then) / price_then) * 100 if price_then > 0 else 0
    direction = "up" if momentum_pct > 0 else "down"

    return {
        "momentum_pct": momentum_pct,
        "direction": direction,
        "price_now": price_now,
        "price_then": price_then,
        "avg_volume": 0,
        "latest_volume": 0,
        "volume_ratio": 1.0,
        "candles": len(history),
        "oracle_updated": oracle_ts,
        "source": "chainlink",
    }


def get_momentum(asset="BTC", source="binance", lookback=5):
    """Get price momentum from configured source."""
    if source == "chainlink":
        return get_chainlink_momentum(asset, lookback)
    elif source == "binance":
        symbol = ASSET_SYMBOLS.get(asset, "BTCUSDT")
        return get_binance_momentum(symbol, lookback)
    elif source == "coingecko":
        cg_id = COINGECKO_ASSETS.get(asset, "bitcoin")
        return get_coingecko_momentum(cg_id, lookback)
    else:
        return None


# =============================================================================
# Import & Trade
# =============================================================================

def import_fast_market_market(api_key, slug):
    """Import a fast market to Simmer. Returns market_id or None."""
    url = f"https://polymarket.com/event/{slug}"
    result = simmer_request("/api/sdk/markets/import", method="POST", data={
        "polymarket_url": url,
        "shared": True,
    }, api_key=api_key)

    if not result:
        return None, "No response from import endpoint"

    if result.get("error"):
        return None, result.get("error", "Unknown error")

    status = result.get("status")
    market_id = result.get("market_id")

    if status == "resolved":
        # Market resolved — check alternatives
        alternatives = result.get("active_alternatives", [])
        if alternatives:
            return None, f"Market resolved. Try alternative: {alternatives[0].get('id')}"
        return None, "Market resolved, no alternatives found"

    if status in ("imported", "already_exists"):
        return market_id, None

    return None, f"Unexpected status: {status}"


def get_market_details(api_key, market_id):
    """Fetch market details by ID."""
    result = simmer_request(f"/api/sdk/markets/{market_id}", api_key=api_key)
    if not result or result.get("error"):
        return None
    return result.get("market", result)


def get_portfolio(api_key):
    """Get portfolio summary."""
    return simmer_request("/api/sdk/portfolio", api_key=api_key)


def get_positions(api_key):
    """Get current positions."""
    result = simmer_request("/api/sdk/positions", api_key=api_key)
    if isinstance(result, dict) and "positions" in result:
        return result["positions"]
    if isinstance(result, list):
        return result
    return []


def _log_trade_attempt(market_id, side, amount, result_dict):
    """Log trade attempt to file for debugging."""
    from pathlib import Path
    log_file = Path(__file__).parent / "trade_attempts.log"
    timestamp = datetime.now(timezone.utc).isoformat()
    
    log_entry = {
        "timestamp": timestamp,
        "market_id": market_id,
        "side": side,
        "amount": amount,
        "result": result_dict
    }
    
    try:
        with open(log_file, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception:
        pass  # Silent fail - don't break trading for logging issues


def execute_trade_sdk(api_key, market_id, side, amount, private_key=None, max_retries=2):
    """Execute a trade using the Simmer Python SDK.
    
    This uses the official SDK which handles all the signing correctly.
    For external wallets, pass private_key to SimmerClient constructor.
    
    Args:
        max_retries: Number of retry attempts if trade doesn't fill (default: 2)
    """
    try:
        from simmer_sdk import SimmerClient
        
        # Initialize client with API key and optional private key for local signing
        if private_key:
            client = SimmerClient(api_key=api_key, private_key=private_key)
            print(f"  🔑 External wallet configured for local signing")
        else:
            client = SimmerClient(api_key=api_key)
        
        last_result = None
        for attempt in range(max_retries + 1):
            if attempt > 0:
                print(f"  🔄 Retry attempt {attempt}/{max_retries}...")
                time.sleep(1.5)  # Brief delay before retry
            
            # Execute trade with GTC order type for better fill rates
            result = client.trade(
                market_id=market_id,
                side=side,
                amount=amount,
                venue="polymarket",
                order_type="GTC",  # Good Till Cancelled
                source=TRADE_SOURCE,
                reasoning=f"BTC momentum signal via {SIGNAL_SOURCE}"
            )
            
            last_result = result
            
            # DEBUG: Log full trade result for troubleshooting
            print(f"  📊 Trade result: success={getattr(result, 'success', False)}, "
                  f"fully_filled={getattr(result, 'fully_filled', 'N/A')}, "
                  f"shares_bought={getattr(result, 'shares_bought', 0):.4f}, "
                  f"cost=${getattr(result, 'cost', 0):.4f}, "
                  f"status={getattr(result, 'order_status', 'unknown')}")
            
            # Check if trade actually filled - CRITICAL FIX
            shares_bought = getattr(result, 'shares_bought', 0) or 0
            cost = getattr(result, 'cost', 0) or 0
            fully_filled = getattr(result, 'fully_filled', False)
            order_status = getattr(result, 'order_status', 'unknown')
            
            # A trade is only truly successful if:
            # 1. SDK reports success AND
            # 2. Shares were actually bought (> 0) AND
            # 3. Cost is greater than 0
            if getattr(result, 'success', False) and shares_bought > 0.01 and cost > 0.01:
                # Trade actually filled
                result_dict = {
                    "success": True,
                    "trade_id": result.trade_id,
                    "shares_bought": shares_bought,
                    "shares": shares_bought,
                    "cost": cost,
                    "error": None,
                    "order_status": order_status,
                    "fully_filled": fully_filled,
                    "attempts": attempt + 1,
                }
                _log_trade_attempt(market_id, side, amount, result_dict)
                return result_dict
            elif getattr(result, 'success', False) and shares_bought == 0:
                # Order accepted but didn't fill - likely low liquidity or price moved
                print(f"  ⚠️  Order accepted but 0 shares filled (status: {order_status})")
                if attempt < max_retries:
                    print(f"  🔄 Will retry...")
                    continue
                else:
                    # No more retries - report as failure
                    result_dict = {
                        "success": False,
                        "trade_id": result.trade_id,
                        "shares_bought": 0,
                        "shares": 0,
                        "cost": 0,
                        "error": f"Order did not fill: {order_status}. Likely low liquidity or price moved.",
                        "order_status": order_status,
                        "fully_filled": False,
                        "attempts": attempt + 1,
                    }
                    _log_trade_attempt(market_id, side, amount, result_dict)
                    return result_dict
            elif not getattr(result, 'success', False):
                # SDK reported failure
                error_msg = getattr(result, 'error', 'Unknown error')
                print(f"  ❌ Trade failed: {error_msg}")
                result_dict = {
                    "success": False,
                    "trade_id": None,
                    "shares_bought": 0,
                    "shares": 0,
                    "cost": 0,
                    "error": error_msg,
                    "order_status": order_status,
                    "fully_filled": False,
                    "attempts": attempt + 1,
                }
                _log_trade_attempt(market_id, side, amount, result_dict)
                return result_dict
        
        # If we exhausted all retries without returning
        result_dict = {
            "success": False,
            "trade_id": getattr(last_result, 'trade_id', None),
            "shares_bought": 0,
            "shares": 0,
            "cost": 0,
            "error": "Trade did not fill after all retry attempts",
            "order_status": getattr(last_result, 'order_status', 'unknown'),
            "fully_filled": False,
            "attempts": max_retries + 1,
        }
        _log_trade_attempt(market_id, side, amount, result_dict)
        return result_dict
        
    except Exception as e:
        print(f"  ⚠️  SDK trade failed: {e}")
        import traceback
        traceback.print_exc()
        result_dict = {"success": False, "error": str(e), "shares_bought": 0, "cost": 0, "attempts": 0}
        _log_trade_attempt(market_id, side, amount, result_dict)
        return result_dict


def execute_trade(api_key, market_id, side, amount, private_key=None):
    """Legacy: Execute a trade on Simmer via REST API.
    
    Deprecated: Use execute_trade_sdk instead for external wallets.
    """
    data = {
        "market_id": market_id,
        "side": side,
        "amount": amount,
        "venue": "polymarket",
        "source": TRADE_SOURCE,
    }
    
    return simmer_request("/api/sdk/trade", method="POST", data=data, api_key=api_key)


def redeem_positions(api_key, private_key=None, quiet=False):
    """Check for and redeem any resolved positions.
    
    Returns list of redeemed positions or empty list if none.
    """
    def log(msg):
        if not quiet:
            print(msg)
    
    log("\n💰 Checking for redeemable positions...")
    
    try:
        # Get current positions
        positions = get_positions(api_key)
        if not positions:
            log("  No open positions to check")
            return []
        
        redeemed = []
        
        for pos in positions:
            market_id = pos.get('market_id')
            question = pos.get('question', 'Unknown')
            shares_yes = pos.get('shares_yes', 0)
            shares_no = pos.get('shares_no', 0)
            pnl = pos.get('pnl', 0)
            
            # Skip if no position in this market
            if shares_yes == 0 and shares_no == 0:
                continue
            
            # Check if market is resolved by fetching market details
            market_details = get_market_details(api_key, market_id)
            if not market_details:
                continue
            
            market_status = market_details.get('status', 'active')
            resolved = market_details.get('resolved', False)
            winning_outcome = market_details.get('winning_outcome')
            
            # Also check if market time has passed (resolves_at)
            resolves_at = market_details.get('resolves_at', '')
            market_ended = False
            if resolves_at:
                try:
                    rt = datetime.fromisoformat(resolves_at.replace('Z', '+00:00'))
                    if datetime.now(timezone.utc) > rt:
                        market_ended = True
                except:
                    pass
            
            # Skip active markets (unless time has passed)
            if market_status == 'active' and not resolved and not market_ended:
                continue
            
            # Skip if already redeemed (no shares left)
            if shares_yes == 0 and shares_no == 0:
                continue
            
            log(f"  🎯 Found resolved position: {question[:50]}...")
            log(f"     Status: {market_status}, Winner: {winning_outcome}")
            log(f"     YES: {shares_yes:.2f}, NO: {shares_no:.2f}, P&L: ${pnl:.2f}")
            
            # Try to redeem via SDK
            try:
                from simmer_sdk import SimmerClient
                
                # Initialize client with private key for external wallet signing
                if private_key:
                    client = SimmerClient(api_key=api_key, private_key=private_key)
                else:
                    client = SimmerClient(api_key=api_key)
                
                # Determine which side(s) to redeem
                winning_outcome = market_details.get('outcome')  # True = YES, False = NO
                
                # Redeem YES shares if we have them
                if shares_yes > 0:
                    log(f"     Redeeming {shares_yes:.2f} YES shares...")
                    result = client.redeem(market_id=market_id, side='yes')
                    if result and getattr(result, 'success', False):
                        log(f"     ✅ YES redeemed! TX: {getattr(result, 'tx_hash', 'N/A')[:16]}...")
                    else:
                        error = getattr(result, 'error', 'Unknown error')
                        log(f"     ⚠️  YES redeem: {error}")
                
                # Redeem NO shares if we have them
                if shares_no > 0:
                    log(f"     Redeeming {shares_no:.2f} NO shares...")
                    result = client.redeem(market_id=market_id, side='no')
                    if result and getattr(result, 'success', False):
                        log(f"     ✅ NO redeemed! TX: {getattr(result, 'tx_hash', 'N/A')[:16]}...")
                    else:
                        error = getattr(result, 'error', 'Unknown error')
                        log(f"     ⚠️  NO redeem: {error}")
                
                # Check if any redemption succeeded
                if shares_yes > 0 or shares_no > 0:
                    redeemed.append({
                        'market_id': market_id,
                        'question': question,
                        'pnl': pnl,
                        'tx_hash': None  # Could capture from result above
                    })
                    
            except ImportError:
                log("     ⚠️  Simmer SDK not available for redeem")
            except Exception as e:
                log(f"     ⚠️  Redeem error: {e}")
        
        if redeemed:
            log(f"\n✅ Redeemed {len(redeemed)} position(s)")
            
            # Write notification for heartbeat
            from pathlib import Path
            notify_file = Path(__file__).parent / ".redeem_notification"
            with open(notify_file, "w") as f:
                f.write(f"POSITIONS_REDEEMED\n")
                f.write(f"Time: {datetime.now(timezone.utc).isoformat()}\n")
                f.write(f"Count: {len(redeemed)}\n")
                total_pnl = sum(r['pnl'] for r in redeemed)
                f.write(f"Total P&L: ${total_pnl:.2f}\n")
                for r in redeemed:
                    f.write(f"- {r['question'][:50]}: ${r['pnl']:.2f}\n")
        else:
            log("  No positions to redeem")
        
        return redeemed
        
    except Exception as e:
        log(f"  ⚠️  Error checking positions: {e}")
        return []


def calculate_position_size(api_key, max_size, smart_sizing=False):
    """Calculate position size, optionally based on portfolio."""
    if not smart_sizing:
        return max_size
    portfolio = get_portfolio(api_key)
    if not portfolio or portfolio.get("error"):
        return max_size
    balance = portfolio.get("balance_usdc", 0)
    if balance <= 0:
        return max_size
    smart_size = balance * SMART_SIZING_PCT
    return min(smart_size, max_size)


# =============================================================================
# Main Strategy Logic
# =============================================================================

def run_fast_market_strategy(dry_run=True, positions_only=False, show_config=False,
                        smart_sizing=False, quiet=False, auto_redeem=False):
    """Run one cycle of the fast_market trading strategy."""

    def log(msg, force=False):
        """Print unless quiet mode is on. force=True always prints."""
        if not quiet or force:
            print(msg)

    log("⚡ Simmer FastLoop Trading Skill")
    log("=" * 50)

    if dry_run:
        log("\n  [DRY RUN] No trades will be executed. Use --live to enable trading.")
    
    # Auto-redeem resolved positions before trading
    if auto_redeem and not dry_run:
        api_key = get_api_key()
        private_key = get_private_key()
        redeem_positions(api_key, private_key=private_key, quiet=quiet)

    log(f"\n⚙️  Configuration:")
    log(f"  Asset:            {ASSET}")
    log(f"  Window:           {WINDOW}")
    log(f"  Entry threshold:  {ENTRY_THRESHOLD} (min divergence from 50¢)")
    log(f"  Min momentum:     {MIN_MOMENTUM_PCT}% (min price move)")
    log(f"  Max position:     ${MAX_POSITION_USD:.2f}")
    log(f"  Signal source:    {SIGNAL_SOURCE}")
    log(f"  Lookback:         {LOOKBACK_MINUTES} minutes")
    log(f"  Min time left:    {MIN_TIME_REMAINING}s")
    log(f"  Volume weighting: {'✓' if VOLUME_CONFIDENCE else '✗'}")
    daily_spend = _load_daily_spend(__file__)
    log(f"  Daily budget:     ${DAILY_BUDGET:.2f} (${daily_spend['spent']:.2f} spent today, {daily_spend['trades']} trades)")

    if show_config:
        config_path = _get_config_path(__file__)
        log(f"\n  Config file: {config_path}")
        log(f"\n  To change settings:")
        log(f'    python fast_trader.py --set entry_threshold=0.08')
        log(f'    python fast_trader.py --set asset=ETH')
        log(f'    Or edit config.json directly')
        return

    api_key = get_api_key()
    private_key = get_private_key()
    
    if private_key:
        log(f"  Wallet:           External (local signing)")
    else:
        log(f"  Wallet:           Simmer hosted")

    # Show positions if requested
    if positions_only:
        log("\n📊 Sprint Positions:")
        positions = get_positions(api_key)
        fast_market_positions = [p for p in positions if "up or down" in (p.get("question", "") or "").lower()]
        if not fast_market_positions:
            log("  No open fast market positions")
        else:
            for pos in fast_market_positions:
                log(f"  • {pos.get('question', 'Unknown')[:60]}")
                log(f"    YES: {pos.get('shares_yes', 0):.1f} | NO: {pos.get('shares_no', 0):.1f} | P&L: ${pos.get('pnl', 0):.2f}")
        return

    # Show portfolio if smart sizing
    if smart_sizing:
        log("\n💰 Portfolio:")
        portfolio = get_portfolio(api_key)
        if portfolio and not portfolio.get("error"):
            log(f"  Balance: ${portfolio.get('balance_usdc', 0):.2f}")

    # Step 1: Discover fast markets
    log(f"\n🔍 Discovering {ASSET} fast markets...")
    markets = discover_fast_market_markets(ASSET, WINDOW, api_key=api_key)
    log(f"  Found {len(markets)} active fast markets")

    if not markets:
        log("  No active fast markets found")
        if not quiet:
            print("📊 Summary: No markets available")
        return

    # Step 2: Find best fast_market to trade
    best = find_best_fast_market(markets)
    if not best:
        log(f"  No fast_markets with >{MIN_TIME_REMAINING}s remaining")
        if not quiet:
            print("📊 Summary: No tradeable fast_markets (too close to expiry)")
        return

    end_time = best.get("end_time")
    remaining = (end_time - datetime.now(timezone.utc)).total_seconds() if end_time else 0
    log(f"\n🎯 Selected: {best['question']}")
    log(f"  Expires in: {remaining:.0f}s")

    # Parse current market odds
    try:
        prices = json.loads(best.get("outcome_prices", "[]"))
        market_yes_price = float(prices[0]) if prices else 0.5
    except (json.JSONDecodeError, IndexError, ValueError):
        market_yes_price = 0.5
    log(f"  Current YES price: ${market_yes_price:.3f}")

    # Fee info (fast markets charge 10% on winnings)
    fee_rate_bps = best.get("fee_rate_bps", 0)
    fee_rate = fee_rate_bps / 10000  # 1000 bps -> 0.10
    if fee_rate > 0:
        log(f"  Fee rate:         {fee_rate:.0%} (Polymarket fast market fee)")

    # Step 3: Get CEX price momentum
    log(f"\n📈 Fetching {ASSET} price signal ({SIGNAL_SOURCE})...")
    momentum = get_momentum(ASSET, SIGNAL_SOURCE, LOOKBACK_MINUTES)

    if not momentum:
        log("  ❌ Failed to fetch price data", force=True)
        return

    log(f"  Price: ${momentum['price_now']:,.2f} (was ${momentum['price_then']:,.2f})")
    log(f"  Momentum: {momentum['momentum_pct']:+.3f}%")
    log(f"  Direction: {momentum['direction']}")
    if momentum.get("source") == "chainlink":
        log(f"  ⚡ Chainlink oracle: 60s edge enabled")
    if momentum.get("source") == "chainlink+binance-bootstrap":
        log(f"  ⚡ Chainlink oracle (bootstrapping momentum from Binance)")
    if VOLUME_CONFIDENCE and momentum.get("volume_ratio", 0) > 0:
        log(f"  Volume ratio: {momentum['volume_ratio']:.2f}x avg")

    # Step 4: Decision logic - IMPROVED
    log(f"\n🧠 Analyzing...")

    momentum_pct = momentum["momentum_pct"]  # Keep sign for direction
    direction = momentum["direction"]
    momentum_abs = abs(momentum_pct)

    # Check minimum momentum
    if momentum_abs < MIN_MOMENTUM_PCT:
        log(f"  ⏸️  Momentum {momentum_abs:.3f}% < minimum {MIN_MOMENTUM_PCT}% — skip")
        if not quiet:
            print(f"📊 Summary: No trade (momentum too weak: {momentum_abs:.3f}%)")
        return

    # IMPROVED: Calculate expected fair price based on momentum magnitude
    # Model: momentum → probability of outcome
    # 0.2% momentum ≈ 52% probability, 0.5% ≈ 55%, 1.0% ≈ 60%
    # Formula: prob = 0.50 + (momentum / 0.10) * 0.01 (capped at 0.35)
    momentum_factor = min(momentum_abs / 0.10, 3.5)  # Cap at 3.5x (35% edge max)
    expected_prob = 0.50 + (momentum_pct / abs(momentum_pct)) * (momentum_factor * 0.01)
    expected_prob = max(0.15, min(0.85, expected_prob))  # Cap between 15% and 85%
    
    # Determine side and calculate edge
    if direction == "up":
        side = "yes"
        expected_price = expected_prob
        edge = expected_price - market_yes_price
        trade_rationale = f"{ASSET} up {momentum_pct:+.3f}% → expected {expected_price:.3f}, market {market_yes_price:.3f}"
    else:
        side = "no"
        expected_price = 1 - expected_prob
        edge = expected_price - (1 - market_yes_price)
        trade_rationale = f"{ASSET} down {momentum_pct:+.3f}% → expected {expected_price:.3f}, market {1-market_yes_price:.3f}"

    log(f"  Expected price:   ${expected_price:.3f} (prob: {expected_prob:.1%})")
    log(f"  Market price:     ${market_yes_price if side == 'yes' else 1-market_yes_price:.3f}")
    log(f"  Edge:             ${edge:.3f} ({edge/expected_price*100:+.1f}%)")

    # Volume confidence adjustment
    vol_note = ""
    vol_multiplier = 1.0
    if VOLUME_CONFIDENCE:
        if momentum.get("volume_ratio", 1.0) < 0.3:
            log(f"  ⏸️  Very low volume ({momentum['volume_ratio']:.2f}x avg) — weak signal, skip")
            if not quiet:
                print(f"📊 Summary: No trade (very low volume)")
            return
        elif momentum["volume_ratio"] < 0.5:
            log(f"  ⚠️  Low volume ({momentum['volume_ratio']:.2f}x avg) — reducing position size")
            vol_multiplier = 0.5
        elif momentum["volume_ratio"] > 3.0:
            vol_note = f" 🔥 (very high volume: {momentum['volume_ratio']:.1f}x avg)"
            vol_multiplier = 1.5
        elif momentum["volume_ratio"] > 2.0:
            vol_note = f" 📊 (high volume: {momentum['volume_ratio']:.1f}x avg)"
            vol_multiplier = 1.2

    # Check edge threshold (improved from simple divergence)
    min_edge = ENTRY_THRESHOLD
    if edge < min_edge:
        log(f"  ⏸️  Edge ${edge:.3f} < minimum ${min_edge:.3f} — skip")
        if not quiet:
            print(f"📊 Summary: No trade (edge too small: ${edge:.3f})")
        return

    # Fee-aware EV check: edge must exceed fees
    if fee_rate > 0:
        buy_price = market_yes_price if side == "yes" else (1 - market_yes_price)
        # Expected value: (prob_win * win_amount) - (prob_loss * loss_amount) - fees
        prob_win = expected_prob if side == "yes" else (1 - expected_prob)
        win_amount = (1 - buy_price) * (1 - fee_rate)
        loss_amount = buy_price
        ev = (prob_win * win_amount) - ((1 - prob_win) * loss_amount)
        
        log(f"  EV calculation:   ${ev:.3f} (prob win: {prob_win:.1%})")
        if ev <= 0:
            log(f"  ⏸️  EV ${ev:.3f} ≤ 0 — fees eat the edge, skip")
            if not quiet:
                print(f"📊 Summary: No trade (negative EV: ${ev:.3f})")
            return
        
        # Scale position by EV (higher EV = bigger position)
        ev_multiplier = min(2.0, max(0.5, 1 + ev * 5))  # 0.5x to 2x based on EV
    else:
        ev_multiplier = 1.0

    # We have a signal!
    # IMPROVED: Dynamic position sizing based on edge and volume
    base_position = MAX_POSITION_USD
    position_size = base_position * vol_multiplier * ev_multiplier
    position_size = min(position_size, MAX_POSITION_USD)  # Cap at max
    position_size = max(position_size, 2.0)  # Min $2 per trade
    
    log(f"  Position sizing:  ${base_position:.2f} base × {vol_multiplier:.1f} vol × {ev_multiplier:.1f} EV = ${position_size:.2f}")
    price = market_yes_price if side == "yes" else (1 - market_yes_price)

    # Daily budget check
    remaining_budget = DAILY_BUDGET - daily_spend["spent"]
    if remaining_budget <= 0:
        log(f"  ⏸️  Daily budget exhausted (${daily_spend['spent']:.2f}/${DAILY_BUDGET:.2f} spent) — skip")
        if not quiet:
            print(f"📊 Summary: No trade (daily budget exhausted)")
        return
    if position_size > remaining_budget:
        position_size = remaining_budget
        log(f"  Budget cap: trade capped at ${position_size:.2f} (${daily_spend['spent']:.2f}/${DAILY_BUDGET:.2f} spent)")
    if position_size < 0.50:
        log(f"  ⏸️  Remaining budget ${position_size:.2f} < $0.50 — skip")
        if not quiet:
            print(f"📊 Summary: No trade (remaining budget too small)")
        return

    # Check minimum order size
    if price > 0:
        min_cost = MIN_SHARES_PER_ORDER * price
        if min_cost > position_size:
            log(f"  ⚠️  Position ${position_size:.2f} too small for {MIN_SHARES_PER_ORDER} shares at ${price:.2f}")
            return

    log(f"  ✅ Signal: {side.upper()} — {trade_rationale}{vol_note}", force=True)
    log(f"  Edge: ${edge:.3f} ({edge/price*100:.1f}%)", force=True)

    # Step 5: Import & Trade
    log(f"\n🔗 Importing to Simmer...", force=True)
    market_id, import_error = import_fast_market_market(api_key, best["slug"])

    if not market_id:
        log(f"  ❌ Import failed: {import_error}", force=True)
        return

    log(f"  ✅ Market ID: {market_id[:16]}...", force=True)

    if dry_run:
        est_shares = position_size / price if price > 0 else 0
        log(f"  [DRY RUN] Would buy {side.upper()} ${position_size:.2f} (~{est_shares:.1f} shares)", force=True)
    else:
        log(f"  Executing {side.upper()} trade for ${position_size:.2f}...", force=True)
        
        # Use Simmer SDK for trading (handles signing correctly)
        result = execute_trade_sdk(api_key, market_id, side, position_size, private_key=private_key)

        # Validate trade actually filled (not just submitted)
        shares = result.get("shares_bought") or result.get("shares") or 0
        cost = result.get("cost") or 0
        is_filled = result and result.get("success") and shares > 0.01 and cost > 0.01

        if is_filled:
            trade_id = result.get("trade_id")
            log(f"  ✅ Bought {shares:.2f} {side.upper()} shares @ ${price:.3f} (cost: ${cost:.2f})", force=True)
            if result.get('attempts', 1) > 1:
                log(f"  🔄 Filled after {result.get('attempts')} attempts", force=True)

            # Update daily spend with ACTUAL cost (not requested amount)
            daily_spend["spent"] += cost
            daily_spend["trades"] += 1
            _save_daily_spend(__file__, daily_spend)

            # Write trade notification file for OpenClaw to pick up
            from pathlib import Path
            trade_notify_file = Path(__file__).parent / ".trade_notification"
            with open(trade_notify_file, "w") as f:
                f.write(f"TRADE_EXECUTED\n")
                f.write(f"Time: {datetime.now(timezone.utc).isoformat()}\n")
                f.write(f"Market: {best['question']}\n")
                f.write(f"Side: {side.upper()}\n")
                f.write(f"Amount: ${cost:.2f}\n")
                f.write(f"Shares: {shares:.2f}\n")
                f.write(f"Price: ${price:.3f}\n")
                f.write(f"Trade ID: {trade_id}\n")
            
            # Also print clear notification
            print(f"\n{'='*50}")
            print(f"🚀 TRADE EXECUTED - {side.upper()}")
            print(f"{'='*50}")
            print(f"Market: {best['question'][:60]}")
            print(f"Amount: ${cost:.2f}")
            print(f"Shares: {shares:.2f} @ ${price:.3f}")
            print(f"Trade ID: {trade_id}")
            print(f"{'='*50}\n")

            # Log to trade journal
            if trade_id and JOURNAL_AVAILABLE:
                confidence = min(0.9, 0.5 + edge + (momentum_pct / 100))
                log_trade(
                    trade_id=trade_id,
                    source=TRADE_SOURCE,
                    thesis=trade_rationale,
                    confidence=round(confidence, 2),
                    asset=ASSET,
                    momentum_pct=round(momentum["momentum_pct"], 3),
                    volume_ratio=round(momentum["volume_ratio"], 2),
                    signal_source=SIGNAL_SOURCE,
                )
        else:
            # Handle specific failure modes
            if result and result.get("success") and shares == 0:
                # Order accepted but didn't fill (low liquidity, price moved)
                log(f"  ⚠️  Trade submitted but did not fill: {result.get('order_status', 'unknown')}", force=True)
                log(f"      Likely cause: Low liquidity or price moved", force=True)
            
            error = result.get("error", "Unknown error") if result else "No response"
            log(f"  ❌ Trade failed: {error}", force=True)
            if result and result.get('attempts', 1) > 1:
                log(f"      Attempts made: {result.get('attempts')}", force=True)

    # Summary
    shares_filled = result.get("shares_bought") or result.get("shares") or 0 if result else 0
    actually_filled = not dry_run and result and result.get("success") and shares_filled > 0.01
    total_trades = 1 if actually_filled else 0
    show_summary = not quiet or total_trades > 0 or (result and not result.get("success") and not dry_run)
    if show_summary:
        action_status = 'DRY RUN' if dry_run else ('TRADED' if total_trades else ('NO FILL' if (result and result.get('success')) else 'FAILED'))
        print(f"\n📊 Summary:")
        print(f"  Sprint: {best['question'][:50]}")
        print(f"  Signal: {direction} {momentum_pct:.3f}% | YES ${market_yes_price:.3f}")
        print(f"  Action: {action_status}")


# =============================================================================
# CLI Entry Point
# =============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simmer FastLoop Trading Skill")
    parser.add_argument("--live", action="store_true", help="Execute real trades (default is dry-run)")
    parser.add_argument("--dry-run", action="store_true", help="(Default) Show opportunities without trading")
    parser.add_argument("--positions", action="store_true", help="Show current fast market positions")
    parser.add_argument("--config", action="store_true", help="Show current config")
    parser.add_argument("--redeem", action="store_true", help="Only redeem resolved positions and exit")
    parser.add_argument("--auto-redeem", action="store_true", help="Auto-redeem resolved positions before trading")
    parser.add_argument("--set", action="append", metavar="KEY=VALUE",
                        help="Update config (e.g., --set entry_threshold=0.08)")
    parser.add_argument("--smart-sizing", action="store_true", help="Use portfolio-based position sizing")
    parser.add_argument("--quiet", "-q", action="store_true",
                        help="Only output on trades/errors (ideal for high-frequency runs)")
    args = parser.parse_args()

    if args.set:
        updates = {}
        for item in args.set:
            if "=" not in item:
                print(f"Invalid --set format: {item}. Use KEY=VALUE")
                sys.exit(1)
            key, val = item.split("=", 1)
            if key in CONFIG_SCHEMA:
                type_fn = CONFIG_SCHEMA[key].get("type", str)
                try:
                    if type_fn == bool:
                        updates[key] = val.lower() in ("true", "1", "yes")
                    else:
                        updates[key] = type_fn(val)
                except ValueError:
                    print(f"Invalid value for {key}: {val}")
                    sys.exit(1)
            else:
                print(f"Unknown config key: {key}")
                print(f"Valid keys: {', '.join(CONFIG_SCHEMA.keys())}")
                sys.exit(1)
        result = _update_config(updates, __file__)
        print(f"✅ Config updated: {json.dumps(updates)}")
        sys.exit(0)

    # Handle --redeem only mode
    if args.redeem:
        api_key = get_api_key()
        private_key = get_private_key()
        redeemed = redeem_positions(api_key, private_key=private_key, quiet=args.quiet)
        sys.exit(0 if redeemed else 0)

    dry_run = not args.live

    run_fast_market_strategy(
        dry_run=dry_run,
        positions_only=args.positions,
        show_config=args.config,
        smart_sizing=args.smart_sizing,
        quiet=args.quiet,
        auto_redeem=args.auto_redeem,
    )
