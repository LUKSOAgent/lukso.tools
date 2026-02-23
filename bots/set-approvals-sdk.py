#!/usr/bin/env python3
"""
Set Polymarket Approvals using Simmer SDK
"""

import os
import sys

# Get API key and private key from environment
API_KEY = "sk_live_4d62d90f1379fc26ec0590280d244213dfe30bc7165f3317d503d4b23aac6f59"
WALLET_ADDRESS = "0x46a89Fe8123840906aF6F1B3A0F24C891dbb9Baa"

def main():
    # Get private key
    private_key = os.environ.get("WALLET_PRIVATE_KEY")
    if not private_key:
        print("❌ WALLET_PRIVATE_KEY not set")
        print("Export it first:")
        print("  export WALLET_PRIVATE_KEY='0x...'")
        sys.exit(1)
    
    print(f"🔧 Setting up approvals for {WALLET_ADDRESS}")
    print(f"   Using Simmer SDK...")
    
    try:
        from simmer_sdk import SimmerClient
        
        # Create client - SDK auto-detects WALLET_PRIVATE_KEY
        os.environ["SIMMER_API_KEY"] = API_KEY
        
        client = SimmerClient(api_key=API_KEY)
        
        print("   Linking wallet...")
        try:
            client.link_wallet()
            print("   ✅ Wallet linked")
        except Exception as e:
            print(f"   ℹ️  Wallet link: {e}")
        
        print("   Setting approvals...")
        result = client.set_approvals()
        print(f"\n✅ Approvals set!")
        print(f"   Set: {result.get('set', 'N/A')}")
        print(f"   Skipped: {result.get('skipped', 'N/A')}")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("   Try: pip3 install simmer-sdk")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()