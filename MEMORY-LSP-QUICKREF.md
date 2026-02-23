# LUKSO LSP Standards - Complete Quick Reference

*Consolidated from sub-agent research on 2026-02-12*

## Core Account Standards (Must Know)

| LSP | Name | Interface ID | Purpose | Key Use Case |
|-----|------|--------------|---------|--------------|
| LSP0 | ERC725Account | 0x24871b3d | Foundational digital identity | Universal Profiles |
| LSP1 | UniversalReceiver | 0x6bb56a14 | Notification/reaction system | Handling transfers |
| LSP6 | KeyManager | 0x23f34c62 | Permission-based access control | Granular permissions |
| LSP9 | Vault | - | Blockchain vault | Asset segregation |

## Asset & Token Standards

| LSP | Name | Purpose | Fungibility |
|-----|------|---------|-------------|
| LSP4 | DigitalAsset-Metadata | Metadata standard for all assets | - |
| LSP7 | DigitalAsset | Fungible token standard | Fungible |
| LSP8 | IdentifiableDigitalAsset | NFT standard (bytes32 token IDs) | Non-fungible |
| LSP5 | ReceivedAssets | Track received assets | - |
| LSP12 | IssuedAssets | Track issued assets | - |

## Identity & Social

| LSP | Name | Purpose | Status |
|-----|------|---------|--------|
| LSP3 | Profile-Metadata | Universal Profile metadata | Draft |
| LSP26 | FollowerSystem | On-chain social graph | Deployed at 0xf011... |
| LSP28 | The Grid | Customizable profile layouts | - |

## Transaction & Execution

| LSP | Name | Purpose | Key Feature |
|-----|------|---------|-------------|
| LSP14 | Ownable 2 Steps | Secure ownership transfer | Two-step process |
| LSP20 | Call Verification | Direct contract calls | No owner resolution |
| LSP25 | ExecuteRelayCall | Gasless meta-transactions | Multi-channel nonces |
| LSP15 | Transaction Relayer API | Relayer service standard | - |

## Factory & Extension Standards

| LSP | Name | Purpose |
|-----|------|---------|
| LSP16 | Universal Factory | Deploy at same address across chains |
| LSP17 | Contract Extension | Add/remove plugins |
| LSP23 | Linked Contracts Factory | Deploy linked contract pairs |

## Data & Metadata

| LSP | Name | Purpose |
|-----|------|---------|
| LSP2 | ERC725Y JSON Schema | Data key-value standardization |
| LSP10 | Received Vaults | List owned vaults |
| LSP18 | Royalties | Royalty recipient data |
| LSP11 | Basic Social Recovery | Account recovery |

## Permission System (LSP6 KeyManager)

**Critical Permissions:**
- `CHANGEOWNER` - Change account owner
- `ADDCONTROLLER` - Add new controllers
- `EDITPERMISSIONS` - Modify permissions
- `CALL` - Call other contracts
- `SUPER_CALL` - Call any contract (no restrictions)
- `TRANSFERVALUE` - Send native tokens
- `SETDATA` - Set ERC725Y data
- `SUPER_SETDATA` - Set any data key
- `SIGN` - Sign messages
- `EXECUTE_RELAY_CALL` - Execute gasless transactions

**Permission Storage:**
```
AddressPermissions:Permissions:<address> = bytes32 BitArray
AddressPermissions:AllowedCalls:<address> = CompactBytesArray
AddressPermissions:AllowedERC725YDataKeys:<address> = CompactBytesArray
```

## Signature Format (LSP25)

```
0x19 || 0x00 || KeyManagerAddress || 25 || chainId || nonce || validityTimestamps || value || calldata
```

## Status Lifecycle

Draft → Review → Last Call → Accepted/Final

All major LSPs currently in **Draft** status (active development).

## Developer Tools Available

- **20+ NPM packages**: `@lukso/lsp0-contracts`, `@lukso/lsp6-contracts`, etc.
- **JavaScript libraries**: `erc725.js`, `eip191-signer.js`, `lsp-utils.js`
- **CLI**: `lukso` command for node management
- **APIs**: Relayer, Indexer, RPC
- **Dev tools**: Foundry template, Remix integration, ERC725 Inspector

## Network Info

- **Chain ID**: 42
- **Currency**: LYX
- **RPC**: Multiple providers available
- **Explorer**: explorer.lukso.network

## Key Data Keys

| Key | Value |
|-----|-------|
| LSP3Profile | 0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5 |
| LSP28TheGrid | 0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff |
| LSP1UniversalReceiverDelegate | 0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbdf6277f3cc0730c45b828b6db8b47 |

## Related Memory Files

- `memory/lukso-dev-tools.md` - Complete developer tools documentation
- `memory/lukso-vision-philosophy.md` - Core vision and philosophy
- `memory/lukso-lips-specifications.md` - Detailed LIP specifications
- `memory/lukso-lsp-standards-complete.md` - Full standards documentation
