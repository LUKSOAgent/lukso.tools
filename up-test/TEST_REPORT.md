# UP Agent Onboard Guide - Test Report
**Date:** 2026-02-08  
**Tester:** AI Agent  
**Guide URL:** https://up-agent-onboard.vercel.app

---

## Summary

The UP Agent Onboard guide was tested using Method 2 (@lukso/lsp-factory.js). **Multiple blockers were encountered** that prevent successful completion without additional setup.

---

## Issues Encountered

### 1. ✅ RESOLVED: Ethers Version Compatibility
**Issue:** lsp-factory.js requires ethers v5, but npm installed ethers v6 by default.

**Error:**
```
Error: Cannot find module '@ethersproject/wallet'
```

**Solution:** Install ethers v5 explicitly:
```bash
npm install @lukso/lsp-factory.js ethers@5
```

---

### 2. ❌ BLOCKER: Node.js v22 + IPFS Compatibility
**Issue:** The lsp-factory.js library uses an outdated ipfs-http-client that is incompatible with Node.js v22.

**Error:**
```
TypeError: RequestInit: duplex option is required when sending a body.
    at node:internal/deps/undici/undici:14902:13
```

**Root Cause:** The library's internal IPFS client doesn't support Node.js v22's fetch API requirements.

**Workaround Attempted:** Deploying without LSP3 metadata (setting `uploadOptions.ipfsClientOptions: null`) bypassed IPFS but revealed the next issue.

---

### 3. ❌ BLOCKER: Gas Fees (LYX Required)
**Issue:** Deploying a Universal Profile requires gas fees paid in LYX (LUKSO's native token).

**Error:**
```
Error: insufficient funds for intrinsic transaction cost
```

**Controller Wallet Generated:**
- **Address:** `0xf4dF36124d5D1bBEc1EE55CA20F70905E0f59e2b`
- **Private Key:** `0xREDACTED_PRIVATE_KEY_6`
- **Balance:** 0.0 LYX

---

### 4. ❌ BLOCKER: Faucet Requires Manual Twitter Auth
**Issue:** The LUKSO testnet faucet (https://faucet.testnet.lukso.network) requires Twitter authentication.

**Faucet Requirements:**
1. Create a tweet with your wallet address
2. Copy the tweet URL
3. Submit via the faucet WebSocket API

**Faucet API Details:**
- **WebSocket Endpoint:** `wss://faucet.testnet.lukso.network/api`
- **Request Format:** `{"url": "TWEET_URL", "tier": 0}`
- **Funding Tiers:**
  - Tier 0: 1 LYXt / 1 hour cooldown
  - Tier 1: 3 LYXt / 3 hours cooldown
  - Tier 2: 10 LYXt / 4 days cooldown

**Why It Can't Be Automated:** Twitter/X requires user authentication and would need access to the user's Twitter account to post tweets.

---

## Method 3 (Relayer API) - Also Failed

**Attempted Endpoint:** `https://relayer.mainnet.lukso.network/v1/deploy`

**Result:** 404 Not Found

The relayer API mentioned in the guide appears to be deprecated or incorrect.

---

## What Worked

1. ✅ Package installation with ethers v5
2. ✅ LSPFactory instantiation
3. ✅ Controller wallet generation
4. ✅ Connection to LUKSO mainnet and testnet RPC
5. ✅ Identified faucet API structure

---

## Controller Wallet for Funding

To complete the test, this controller wallet needs test LYX:

```
Address:     0xf4dF36124d5D1bBEc1EE55CA20F70905E0f59e2b
Private Key: 0xREDACTED_PRIVATE_KEY_6
```

**Manual Steps to Get Test LYX:**
1. Visit https://faucet.testnet.lukso.network
2. Click the tweet link with the controller address pre-filled
3. Post the tweet
4. Copy the tweet URL
5. Paste it into the faucet input box
6. Select funding tier and submit
7. Wait for confirmation

---

## Recommendations

1. **Update Guide Dependencies:** Specify ethers@5 in the installation instructions
2. **Node.js Version Warning:** Add a note about Node.js v22 compatibility issues
3. **Faucet Instructions:** Provide clear manual steps for obtaining test LYX
4. **Alternative:** Consider documenting how to use an existing funded wallet
5. **Relayer API:** Update or remove the relayer API section if it's no longer available

---

## Conclusion

The UP Agent Onboard guide provides a good overview but has several practical blockers:
- Outdated dependencies (ethers v5 vs v6)
- Node.js v22 incompatibility with IPFS client
- Gas requirement without clear funding path
- Non-existent relayer endpoint

**Status:** Cannot complete UP deployment without manual intervention to obtain test LYX and potentially downgrade Node.js or use a different IPFS configuration.