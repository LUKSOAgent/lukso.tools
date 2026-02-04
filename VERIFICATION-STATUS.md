# AGENTPO Contract Verification

## Status
❌ Automated verification failed - Contract too large for API (3514 lines, 130KB)

## Contract Details
- **Address:** 0x47568BC4DC7Fee1bB67f741BA927e2904B61f016
- **Name:** LSP7Mintable
- **Compiler:** Solidity 0.8.17
- **Optimization:** Enabled, 200 runs
- **EVM Version:** London
- **License:** Apache-2.0

## Constructor Arguments (ABI Encoded)
```
00000000000000000000000000000000000000000000000000000000000000a0
00000000000000000000000000000000000000000000000000000000000000e0
000000000000000000000000293e96ebbf264ed7715cff2b67850517de70232a
0000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000c4
167656e7420506f7461746f0000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000007
4147454e54504f00000000000000000000000000000000000000000000000000
```

Decoded:
- name_: "Agent Potato"
- symbol_: "AGENTPO"
- newOwner_: 0x293E96ebbf264ed7715cff2b67850517De70232a
- lsp4TokenType_: 0 (Token)
- isNonDivisible_: false (Divisible)

## Files Ready for Verification
1. `/root/.openclaw/workspace/flattened-LSP7Mintable.sol` - Flattened source (3514 lines)
2. `/root/.openclaw/workspace/verification-payload.json` - Verification data

## Manual Verification URL
https://explorer.execution.mainnet.lukso.network/address/0x47568BC4DC7Fee1bB67f741BA927e2904B61f016/contract-verification

## Alternative: Sourcify
https://sourcify.dev/#/verifier

## Notes
The contract imports many dependencies (LSP4, LSP1, LSP17, etc.) which required flattening using truffle-flattener. The resulting file is quite large due to all the inherited LUKSO standards implementations.