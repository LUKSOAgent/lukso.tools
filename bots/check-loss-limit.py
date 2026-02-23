#!/usr/bin/env python3
"""
Check daily P&L and stop trading if loss limit reached
"""

import os
import sys
import json
import requests
from datetime import datetime

API_KEY = "sk_live_4d62d90f1379fc26ec0590280d244213dfe30bc7165f3317d503d4b23aac6f59"
LOSS_LIMIT = 20.00  # Stop trading after $20 loss

def get_today_pnl():
    """Get today's P&L from Simmer API"""
    try:
        resp = requests.get(
            "https://api.simmer.markets/api/sdk/portfolio",
            headers={"Authorization": f"Bearer {API_KEY}"}
        )
        data = resp.json()
        return data.get("pnl_24h", 0) or 0
    except Exception as e:
        print(f"Error fetching P&L: {e}")
        return 0

def main():
    pnl = get_today_pnl()
    
    print(f"📊 Daily P&L Check")
    print(f"   Current P&L: ${pnl:.2f}")
    print(f"   Loss limit: -${LOSS_LIMIT:.2f}")
    
    if pnl < -LOSS_LIMIT:
        print(f"\n🛑 STOP: Daily loss limit reached!")
        print(f"   Loss: ${pnl:.2f} (limit: -${LOSS_LIMIT:.2f})")
        print(f"   Trading paused until tomorrow.")
        sys.exit(1)  # Signal to stop
    else:
        print(f"\n✅ Within limits. Can trade.")
        print(f"   Remaining: ${LOSS_LIMIT + pnl:.2f} until limit")
        sys.exit(0)  # Signal OK

if __name__ == "__main__":
    main()