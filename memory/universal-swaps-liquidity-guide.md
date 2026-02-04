# Adding Liquidity on Universal Swaps (LUKSO)

## Overview
Universal Swaps is the native DEX on LUKSO (fork of Uniswap V2).

## Requirements
1. **LYX** for gas + liquidity pair
2. **Token** (e.g., AGENTPO) for liquidity pair
3. **Universal Profile** with controller access

## Router Contract
**Address:** `0xA46d16FB9F228785cF1A7C20415bb5AfC193945A`

## Steps

### 1. Approve Router to Spend Tokens
```javascript
const LSP7_ABI = [
  "function authorizeOperator(address operator, uint256 amount, bytes calldata data) external"
];

// Authorize router to spend AGENTPO
const tokenContract = new ethers.Contract(AGENTPO_ADDRESS, LSP7_ABI, provider);
const approveCalldata = tokenContract.interface.encodeFunctionData(
  "authorizeOperator",
  [ROUTER_ADDRESS, AMOUNT, "0x"]
);
```

### 2. Add Liquidity
```javascript
const ROUTER_ABI = [
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
];

const routerContract = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);

const addLiquidityCalldata = routerContract.interface.encodeFunctionData(
  "addLiquidityETH",
  [
    TOKEN_ADDRESS,      // e.g., AGENTPO
    TOKEN_AMOUNT,       // Amount of tokens
    0,                  // amountTokenMin (slippage)
    0,                  // amountETHMin (slippage)
    UP_ADDRESS,         // LP tokens recipient
    DEADLINE            // Math.floor(Date.now()/1000) + 20*60
  ]
);
```

### 3. Execute via UP
```javascript
// Execute via UP -> KeyManager
const LSP0_ABI = ["function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)"];

const upExecutePayload = lsp0Iface.encodeFunctionData("execute", [
  0,                    // CALL operation
  ROUTER_ADDRESS,       // Target
  LYX_AMOUNT,           // LYX to send
  addLiquidityCalldata  // Encoded call
]);

await keyManagerContract.execute(upExecutePayload, {
  gasLimit: 500000,
  value: LYX_AMOUNT    // LYX for liquidity + gas
});
```

## Example Amounts
- **AGENTPO:** 100,000 tokens
- **LYX:** 10 LYX
- **Slippage:** 0% (for testing, use >0 for production)

## Current Status
- Router approved for AGENTPO ✅
- Insufficient LYX balance (~1.1 LYX, need ~10+ LYX) ❌
- Waiting for LYX funding to complete

## Frontend Alternative
If code fails, use: https://universalswaps.io
1. Connect UP (via Universal Page or Wallet)
2. Select token pair (AGENTPO/LYX)
3. Enter amounts
4. Approve + Add Liquidity

## Resources
- Explorer: https://explorer.lukso.network
- Universal Everything: https://universaleverything.io
