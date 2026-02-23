#!/usr/bin/env python3
"""
Set Polymarket Approvals for Simmer Trading
Signs and broadcasts approval transactions for USDC and CTF tokens
"""

import os
import sys
import json
import requests
from eth_account import Account
from eth_account.datastructures import SignedTransaction

# Configuration
API_KEY = "sk_live_4d62d90f1379fc26ec0590280d244213dfe30bc7165f3317d503d4b23aac6f59"
API_BASE = "https://api.simmer.markets"
WALLET_ADDRESS = "0x46a89Fe8123840906aF6F1B3A0F24C891dbb9Baa"

def get_allowances():
    """Get current allowance status"""
    resp = requests.get(
        f"{API_BASE}/api/polymarket/allowances/{WALLET_ADDRESS}",
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    return resp.json()

def get_approval_txs():
    """Get unsigned approval transactions"""
    resp = requests.get(
        f"{API_BASE}/api/polymarket/allowances/{WALLET_ADDRESS}?generate_txs=true",
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    return resp.json()

def broadcast_tx(signed_tx_hex):
    """Broadcast signed transaction via Simmer"""
    resp = requests.post(
        f"{API_BASE}/api/sdk/wallet/broadcast-tx",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={"signed_tx": signed_tx_hex}
    )
    return resp.json()

def sign_transaction(tx_dict, private_key):
    """Sign a transaction with private key"""
    signed = Account.sign_transaction(tx_dict, private_key)
    return signed.rawTransaction.hex()

def main():
    # Get private key from environment
    private_key = os.environ.get("WALLET_PRIVATE_KEY")
    if not private_key:
        print("❌ WALLET_PRIVATE_KEY not set")
        print("Export it first: export WALLET_PRIVATE_KEY='0x...'")
        sys.exit(1)
    
    # Verify key matches address
    account = Account.from_key(private_key)
    if account.address.lower() != WALLET_ADDRESS.lower():
        print(f"❌ Private key doesn't match {WALLET_ADDRESS}")
        print(f"   Key address: {account.address}")
        sys.exit(1)
    
    print("🔍 Checking current allowances...")
    allowances = get_allowances()
    
    if allowances.get("all_set"):
        print("✅ All approvals already set!")
        return
    
    missing = allowances.get("missing", [])
    print(f"⏳ Missing {len(missing)} approvals:")
    for item in missing:
        print(f"   - {item}")
    
    print("\n📡 Fetching approval transactions...")
    # Note: Simmer API should provide unsigned transactions
    # If not available, we may need to construct them manually
    
    # For now, let's try to get tx params
    tx_data = get_approval_txs()
    
    if not tx_data.get("tx_params"):
        print("⚠️  No transaction params available from API")
        print("   Simmer may require manual approval via dashboard")
        print("   OR the API endpoint may be different")
        print("\n   Trying alternative approach...")
        
        # Alternative: Use Simmer SDK approach
        print("\n📋 Manual steps required:")
        print("   1. Go to https://simmer.markets/dashboard")
        print("   2. Navigate to 'Wallet' or 'Settings'")
        print("   3. Look for 'Approvals' or 'Permissions'")
        print("   4. Click 'Set All Approvals'")
        print("   5. Sign 9 transactions in MetaMask")
        return
    
    # Sign and broadcast each transaction
    signed_count = 0
    for i, tx in enumerate(tx_data.get("tx_params", [])):
        print(f"\n📝 Signing transaction {i+1}/{len(tx_data['tx_params'])}...")
        
        try:
            signed = sign_transaction(tx, private_key)
            print("   Broadcasting...")
            result = broadcast_tx(signed)
            
            if result.get("success"):
                print(f"   ✅ Success: {result.get('tx_hash', 'OK')}")
                signed_count += 1
            else:
                print(f"   ❌ Failed: {result.get('error', 'Unknown')}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print(f"\n{'='*50}")
    print(f"Signed {signed_count}/{len(tx_data.get('tx_params', []))} approvals")
    
    if signed_count > 0:
        print("\n🔍 Rechecking allowances...")
        allowances = get_allowances()
        if allowances.get("all_set"):
            print("✅ All approvals now set!")
        else:
            remaining = len(allowances.get("missing", []))
            print(f"⏳ {remaining} approvals still pending")

if __name__ == "__main__":
    main()