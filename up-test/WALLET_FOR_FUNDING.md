# LSP23 Deployment - Wallet Ready for Funding

## Controller Wallet (Needs Test LYX)

**Address:** `0xf5476E5fCC74087D1540d396DC884b3945a6e085`

**Private Key:** `0xab9bffd47df1454b1e6b51d2dd9412ec585d8917f633038897902c13c1e81608`

**Balance:** 0.0 LYX (needs funding)

---

## LSP23 Deployment Details

**Factory Contract:** `0x2300000A84D25dF63081feAa37ba6b62C4c89a30`

**Post Deployment Module:** `0x000000000066093407b6704B89793beFfD0D8F00`

**UP Implementation:** `0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F`

**KeyManager Implementation:** `0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4`

---

## Transaction Encoding Status

✅ Transaction constructed successfully  
✅ ABI encoding correct  
✅ Factory contract callable  
❌ Failed at: Gas payment (insufficient funds)

---

## How to Complete Deployment

1. Get test LYX from https://faucet.testnet.lukso.network
   - Post tweet with address: `0xf5476E5fCC74087D1540d396DC884b3945a6e085`
   - Submit tweet URL to faucet
   - Wait for 1-10 LYXt

2. Re-run the deployment script:
   ```bash
   node deploy-lsp23.js
   ```

3. The script will output:
   - UP (LSP0) Address
   - KeyManager (LSP6) Address
   - Transaction Hash

---

## Gas Estimate

Estimated gas required: ~5,000,000 gas  
Estimated cost: ~0.0075 LYX

---

## Network Details

- **Network:** LUKSO Testnet
- **Chain ID:** 4201
- **RPC:** https://rpc.testnet.lukso.network