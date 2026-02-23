#!/usr/bin/env python3
"""
Redeem settled Polymarket positions via CLOB API.
"""
import json
import os
import sys
import requests

API_KEY = os.environ.get("CLOB_API_KEY", "654e497b-4be6-d408-9172-f32a3fe546ea")
SECRET = os.environ.get("CLOB_SECRET", "c6mBg9rnxtDYByW4yXVK1u-zc0ad1QvkwG13urN_qYA=")
PASSPHRASE = os.environ.get("CLOB_PASSPHRASE", "c90a9bc4ea77d5f1c67e66ce812cc95d395b5d233f615a8423b67a3871bdf811")
BASE = "https://clob.polymarket.com"

def get_headers():
    import hmac, hashlib, base64, time
    ts = str(int(time.time()))
    sig_str = ts + "GET" + "/positions"
    sig = base64.b64encode(
        hmac.new(base64.b64decode(SECRET), sig_str.encode(), hashlib.sha256).digest()
    ).decode()
    return {
        "POLY-API-KEY": API_KEY,
        "POLY-SIGNATURE": sig,
        "POLY-TIMESTAMP": ts,
        "POLY-PASSPHRASE": PASSPHRASE,
    }

def get_redeemable():
    try:
        r = requests.get(f"{BASE}/positions", headers=get_headers(), timeout=10)
        if r.status_code != 200:
            print(f"Positions fetch failed: {r.status_code} {r.text[:200]}")
            return []
        positions = r.json() if isinstance(r.json(), list) else r.json().get("data", [])
        redeemable = [p for p in positions if p.get("redeemable") or p.get("outcome_value")]
        return redeemable
    except Exception as e:
        print(f"Error: {e}")
        return []

def redeem(market_id):
    try:
        import hmac, hashlib, base64, time
        ts = str(int(time.time()))
        body = json.dumps({"market": market_id})
        sig_str = ts + "POST" + "/redeem" + body
        sig = base64.b64encode(
            hmac.new(base64.b64decode(SECRET), sig_str.encode(), hashlib.sha256).digest()
        ).decode()
        headers = {
            "POLY-API-KEY": API_KEY,
            "POLY-SIGNATURE": sig,
            "POLY-TIMESTAMP": ts,
            "POLY-PASSPHRASE": PASSPHRASE,
            "Content-Type": "application/json",
        }
        r = requests.post(f"{BASE}/redeem", headers=headers, data=body, timeout=10)
        return r.status_code == 200, r.text
    except Exception as e:
        return False, str(e)

if __name__ == "__main__":
    print("Checking for redeemable positions...")
    positions = get_redeemable()
    if not positions:
        print("No redeemable positions found.")
        sys.exit(0)
    
    redeemed = 0
    for p in positions:
        market = p.get("market") or p.get("condition_id", "")
        ok, detail = redeem(market)
        if ok:
            print(f"✅ Redeemed: {market}")
            redeemed += 1
        else:
            print(f"❌ Failed {market}: {detail}")
    
    print(f"\nTotal redeemed: {redeemed}/{len(positions)}")
