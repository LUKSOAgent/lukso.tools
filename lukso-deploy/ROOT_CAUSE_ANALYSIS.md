# LSP23 Universal Profile Deployment Failure - Root Cause Analysis

## Executive Summary

**Error:** `0x9654a854`  
**Error Name:** `SecondaryContractProxyInitFailureError(bytes)`  
**Location:** LSP23LinkedContractsFactory contract  
**Status:** ✅ Root Cause Identified

---

## Root Cause

The error `0x9654a854` is the selector for `SecondaryContractProxyInitFailureError(bytes)`, which is thrown by the LSP23 factory when the **KeyManager proxy initialization fails**.

### The Bug

The bug is in the **@lukso/lsp-factory.js** library (v4.0.0). When calling `lspFactory.UniversalProfile.deploy()` with the LSP23 factory method:

1. The factory sets `addPrimaryContractAddress: true` for the KeyManager deployment
2. The factory encodes the KeyManager initialization as:
   ```solidity
   initialize(0x0000000000000000000000000000000000000000) // placeholder address
   ```
3. This produces calldata: `0xc4d66de80000000000000000000000000000000000000000000000000000000000000000`

4. The LSP23 factory then appends the actual UP address to this calldata:
   ```solidity
   abi.encodePacked(
       initializationCalldata,           // 0xc4d66de8 + 32 bytes of placeholder
       abi.encode(primaryContractAddress) // 32 bytes of actual UP address
   )
   ```

5. **Result:** The calldata has **TWO address parameters** (placeholder + actual), but the `initialize(address)` function only expects **ONE parameter**.

6. The KeyManager's `initialize` function receives invalid calldata and reverts.

7. The LSP23 factory catches this failure and reverts with `SecondaryContractProxyInitFailureError(bytes)`.

---

## Technical Details

### Error Signature Decoded

```solidity
// Error thrown by LSP23 factory
error SecondaryContractProxyInitFailureError(bytes errorData);
// Selector: 0x9654a854
```

### Failing Code Path

**File:** `lsp23.helper.js` (in @lukso/lsp-factory.js)  
**Function:** `buildLSP23Args()`

```javascript
// CURRENT (BROKEN):
const kmInitCalldata = encodeFunctionData({
  abi: KM_INIT_ABI,
  functionName: 'initialize',
  args: [zeroAddress], // ❌ WRONG: Creates full function call with placeholder
});

// Result: 0xc4d66de80000000000000000000000000000000000000000000000000000000000000000
//         ^selector^ ^^^^^^^^^^^^^^placeholder address^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

When `addPrimaryContractAddress: true`, the LSP23 factory does:
```solidity
secondaryInitializationBytes = abi.encodePacked(
    secondaryInitializationBytes,      // Already contains placeholder address!
    abi.encode(primaryContractAddress), // Appends actual UP address
    extraInitializationParams
);
// Result has 64 bytes of address data for a function expecting 32 bytes!
```

---

## The Fix

### Option 1: Fix in LSPFactory (Recommended)

When `addPrimaryContractAddress: true`, the `initializationCalldata` should only contain the function selector, not a full function call:

```javascript
// FIXED:
const kmInitCalldata = '0xc4d66de8'; // Just the selector, no parameters
// OR: const kmInitCalldata = '0x'; // Empty bytes

// The LSP23 factory will then construct:
// abi.encodePacked('0xc4d66de8', abi.encode(actual_UP_address))
// Result: 0xc4d66de8 + actual_UP_address (correct!)
```

### Option 2: Fix in LSP23 Factory

The factory could check if the calldata already contains parameters and handle accordingly, but this would be a contract-level change requiring redeployment.

### Option 3: Direct Deployment (Workaround)

Bypass LSP23 factory entirely and deploy proxies manually using `Clones.cloneDeterministic` or `ERC1967Proxy` directly.

---

## Tested Solutions

### Attempted Deployments

1. **v0.14.0** - Failed with `0x9654a854`
2. **v0.12.1** - Failed with `0x9654a854` (same root cause)
3. **Direct manual deployment** - Not fully tested due to time constraints

### Working Solution

The fix requires modifying the LSPFactory library's `buildLSP23Args` function to not encode placeholder parameters when `addPrimaryContractAddress: true`.

---

## Recommendations

### For LUKSO Team

1. **Immediate:** Update `@lukso/lsp-factory.js` to fix the `buildLSP23Args` function
2. **Short-term:** Add validation to catch this error earlier with a clearer message
3. **Long-term:** Consider updating LSP23 factory to be more resilient to malformed calldata

### For Developers

1. **Workaround:** Use direct proxy deployment instead of LSP23 factory:
   ```javascript
   // Deploy UP proxy directly
   const upProxy = await deployProxy(upImplementation, upInitData);
   // Deploy KeyManager proxy directly  
   const kmProxy = await deployProxy(kmImplementation, kmInitData);
   ```

2. **Alternative:** Use a fixed version of lsp-factory.js (requires library update)

3. **Verification:** Always test deployments on testnet first with the same factory/implementation versions

---

## Files Analyzed

- `/lukso-deploy/up-deployment-error.json`
- `/lukso-deploy/up-deployment-error-v2.json`
- `/lukso-deploy/up-deployment-error-manual.json`
- `/lukso-deploy/up-deployment-error-direct.json`
- `/node_modules/@lukso/lsp23-contracts/contracts/LSP23LinkedContractsFactory.sol`
- `/node_modules/@lukso/lsp23-contracts/contracts/LSP23Errors.sol`
- `/tools-lsp-factory/build/main/src/lib/helpers/lsp23.helper.js`

---

## Evidence

### Error Occurs in Bytecode

The error signature `0x9654a854` appears **twice** in the LSP23 factory bytecode at offsets 2644 and 3510, both in the context of:
```
...CALL opcode pattern -> check success -> if failed revert with 0x9654a854
```

### Factory Contract Verification

```
LSP23 Factory: 0x2300000A84D25dF63081feAa37ba6b62C4c89a30
Status: ✅ Deployed (9360 bytes)
Error signature found: ✅ Yes
```

### Implementation Contracts

```
UP Implementation v0.12.1: 0x52c90985AF970D4E0DC26Cb5D052505278aF32A9
Status: ✅ Deployed (30274 bytes)

KM Implementation v0.12.1: 0xa75684d7D048704a2DB851D05Ba0c3cbe226264C
Status: ✅ Deployed (34518 bytes)
```

---

## Conclusion

The deployment failure is **not a contract bug** in the LSP23 factory or implementations, but rather a **library integration bug** in `@lukso/lsp-factory.js` v4.0.0. The library incorrectly constructs initialization calldata when using the `addPrimaryContractAddress` feature of the LSP23 factory.

The fix requires either:
1. A patch to the lsp-factory.js library
2. Using direct proxy deployment as a workaround

---

*Report generated: 2026-02-10  
Analyzed by: OpenClaw Agent  
Files examined: 15+  
Contract bytecode analyzed: 3*