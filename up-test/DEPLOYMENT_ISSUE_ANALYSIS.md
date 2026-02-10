# Deployment Issue Analysis

## Transaction Failed
- **Transaction Hash:** `0x12a6209012c85751f94d0e084957a7458194ae74974dd14542b6cb498fc3dbba`
- **Block:** 6903951
- **Gas Used:** 172,697
- **Status:** Reverted (status: 0)

## Root Cause
The LSP23 factory transaction is failing during the KeyManager initialization. The issue is with the `addPrimaryContractAddress` parameter and how the factory appends the UP address to the KeyManager's initialization calldata.

## The Problem

When `addPrimaryContractAddress: true`, the LSP23 factory:
1. Deploys the UP proxy
2. Takes the KeyManager initialization calldata
3. Appends the UP address (32 bytes) to the end of the calldata
4. Calls the KeyManager's initialize function with this extended calldata

However, the LSP6KeyManagerInit's initialize function signature is:
```solidity
function initialize(address target, address[] calldata controllers, bytes32[] calldata permissions)
```

The factory appends the UP address to the END of the calldata, but the function expects it as the FIRST parameter. This mismatch causes the transaction to revert.

## Potential Solutions

### Option 1: Don't Use addPrimaryContractAddress
Set `addPrimaryContractAddress: false` and compute the UP address beforehand using `computeERC1167Addresses`, then use that address in the KeyManager initialization.

### Option 2: Two-Step Deployment
1. First call: Deploy only the UP (or use a dummy secondary deployment)
2. Second call: Deploy KeyManager separately with the known UP address

### Option 3: Use Post-Deployment Module
The `UniversalProfileInitPostDeploymentModule` is designed to handle the setup AFTER both contracts are deployed. The factory calls this module with both addresses.

The module's `executePostDeployment` function:
```solidity
function executePostDeployment(
  address universalProfile,
  address keyManager,
  bytes calldata setDataBatchBytes
) external
```

We need to encode the proper calldata for this function.

## Recommendation

**Use Option 3 with the Post-Deployment Module.**

This is how the UP Browser Extension does it - the factory deploys both proxies, then calls the post-deployment module to:
1. Link the KeyManager to the UP
2. Set the controller permissions
3. Set any LSP3 metadata

## Required Calldata

For the post-deployment module:
```javascript
const postDeploymentABI = [
  'function executePostDeployment(address universalProfile, address keyManager, bytes calldata setDataBatchBytes) external'
];
const moduleInterface = new ethers.utils.Interface(postDeploymentABI);
const postDeploymentCalldata = moduleInterface.encodeFunctionData('executePostDeployment', [
  ethers.constants.AddressZero, // Will be replaced by factory
  ethers.constants.AddressZero, // Will be replaced by factory
  '0x' // setDataBatchBytes - can set LSP3 metadata here
]);
```

The factory will replace the zero addresses with the actual deployed addresses when calling the module.

## Resources Needed

To implement this correctly, we need:
1. The correct ABI for `UniversalProfileInitPostDeploymentModule`
2. Proper encoding of the `setDataBatchBytes` parameter
3. Potentially more gas (currently using ~173k of 5M limit)

## Current Status

- Controller funded with 0.5 LYX ✓
- Factory contract accessible ✓
- Transaction encoding correct ✓
- Deployment logic needs adjustment ⚠️

## Next Steps

1. Research the correct post-deployment module usage
2. Implement proper calldata encoding
3. Retry deployment with corrected parameters
4. Or: Switch to a simpler two-step deployment approach

## Alternative: Direct Deployment

If the LSP23 factory approach continues to fail, we could deploy contracts directly:
1. Deploy ERC1167 proxy for UP
2. Call UP.initialize(controller)
3. Deploy ERC1167 proxy for KeyManager
4. Call KeyManager.initialize(upAddress, [controller], [permissions])

This bypasses the factory complexity but requires more transactions.