# LUKSO Knowledge Base

*Building comprehensive knowledge to assist developers and community*

## Network Basics

- **Chain ID:** 42
- **Native Token:** LYX
- **Consensus:** Casper FFG + LMD-GHOST (Gasper)
- **Architecture:** Unmodified Ethereum protocol (consensus + execution clients, EVM)
- **Mission:** Blockchain for social, culture, and creators
- **Main Innovation:** LSP Standards (LUKSO Standard Proposals) as composable building blocks

### Network Parameters
- Block Explorer: https://explorer.lukso.network
- RPC Providers:
  - Thirdweb: https://42.rpc.thirdweb.com
  - SigmaCore: https://rpc.lukso.sigmacore.io (API key required)
  - NowNodes: https://lukso.nownodes.io (API key required)
  - Envio (read-only): https://lukso.rpc.hypersync.xyz
- IPFS Gateway (dev only): https://api.universalprofile.cloud/ipfs

## Core LSP Standards

### LSP0 - ERC725Account
**The foundation for Universal Profiles and blockchain-based accounts.**

Built from multiple standards:
- **ERC165:** Interface detection
- **ERC725X:** Generic executor (CALL, STATICCALL, DELEGATECALL, CREATE, CREATE2)
- **ERC725Y:** Generic key-value store for flexible metadata
- **ERC1271:** Message signature verification for smart contract accounts
- **LSP1:** UniversalReceiver for notification of incoming transactions
- **LSP14:** Ownable2Step for secure ownership transfer
- **LSP17:** ContractExtension for post-deployment upgradability
- **LSP20:** CallVerification for unified interaction regardless of owner type

**Key Features:**
- Smart contract-based account (not just EOA)
- Can execute transactions, deploy contracts, hold assets
- Flexible data storage via ERC725Y (can add new data after deployment)
- Can verify signatures (ERC1271)
- Receives notifications via LSP1 UniversalReceiver
- Extensible after deployment via LSP17
- Secure 2-step ownership transfer via LSP14

**Operations (ERC725X):**
- 0: CALL - transfer value or call functions
- 1: CREATE - deploy contracts (address = contract + nonce)
- 2: CREATE2 - deploy contracts with predetermined address
- 3: STATICCALL - read-only calls
- 4: DELEGATECALL - execute code in account's context (currently disabled for security)

### LSP6 - Key Manager
**Permission-based access control system for LSP0 accounts.**

Acts as the "brain" behind Universal Profiles. Controls who can do what on a UP.

**Core Concept:**
- Key Manager = owner of LSP0 account
- Multiple "controllers" (addresses with specific permissions)
- Controllers can be EOAs or smart contracts
- Permissions stored in ERC725Y storage of the account (not in Key Manager)

**Permission Types:**

*Basic Permissions:*
- **CHANGEOWNER** (0x01): Change account owner
- **ADDCONTROLLER** (0x02): Add new permissioned addresses
- **EDITPERMISSIONS** (0x04): Edit existing controller permissions
- **ADDEXTENSIONS** (0x08): Add LSP17 extensions
- **CHANGEEXTENSIONS** (0x10): Edit LSP17 extensions
- **ADDUNIVERSALRECEIVERDELEGATE** (0x20): Add LSP1 delegates
- **CHANGEUNIVERSALRECEIVERDELEGATE** (0x40): Edit LSP1 delegates
- **REENTRANCY** (0x80): Allow reentrant calls
- **TRANSFERVALUE** (0x0200): Transfer native tokens (with restrictions)
- **CALL** (0x0800): Call external contracts (with restrictions)
- **STATICCALL** (0x2000): Read-only external calls (with restrictions)
- **DELEGATECALL** (0x8000): Execute in account context (disabled)
- **DEPLOY** (0x010000): Deploy new contracts
- **SETDATA** (0x040000): Write to ERC725Y storage (with restrictions)
- **ENCRYPT** (0x080000): Encrypt messages
- **DECRYPT** (0x100000): Decrypt messages
- **SIGN** (0x200000): Sign on behalf of account (e.g., login)
- **EXECUTE_RELAY_CALL** (0x400000): Allow relay execution

*SUPER Permissions:*
Same as regular but skip restriction checks (cheaper gas, no AllowedCalls/AllowedERC725YDataKeys checks):
- **SUPER_TRANSFERVALUE** (0x0100)
- **SUPER_CALL** (0x0400)
- **SUPER_STATICCALL** (0x1000)
- **SUPER_DELEGATECALL** (0x4000)
- **SUPER_SETDATA** (0x020000)

**Permission Restrictions:**

*Allowed Calls:*
Format: `(bytes4 callType, address target, bytes4 standard, bytes4 function)[CompactBytesArray]`
- callType: TRANSFERVALUE (0x01), CALL (0x02), STATICCALL (0x04), DELEGATECALL (0x08)
- target: specific address or 0xffffffff... (any)
- standard: ERC165 interface ID or 0xffffffff (any)
- function: function selector or 0xffffffff (any)

*Allowed ERC725Y Data Keys:*
Format: `bytes[CompactBytesArray]`
- Fixed-size (32 bytes): controller can only set that specific key
- Dynamic-size (1-31 bytes): controller can set any key starting with that prefix

**Execution Types:**
1. **Direct execution:** User calls `execute()` on Key Manager
2. **Relay execution:** User signs payload, relayer calls `executeRelayCall()` (gas-less transactions)
3. **Direct to target:** User calls UP directly, UP verifies via LSP20

### LSP7 - Digital Asset
**Fungible token standard (improved ERC20/ERC777).**

**Key Improvements:**
- **Divisible vs Non-Divisible:** Constructor parameter for decimals
- **Unlimited Metadata:** Uses LSP4-DigitalAssetMetadata (ERC725Y storage)
- **Token Hooks (LSP1):** Notify sender and recipient on transfer
- **Force parameter:** Safety mechanism for transfers

**Token Hooks:**
When transferring LSP7 tokens, both sender and recipient's `universalReceiver()` is called:
- Sender typeId: `0x429ac7a06903dbc9c13dfcb3c9d11df8194581fa047c96d7a4171fc7402958ea` (LSP7Tokens_SenderNotification)
- Recipient typeId: `0x20804611b3e2ea21c480dc465142210acf4a2485947541770ec1fb87dee4a55c` (LSP7Tokens_RecipientNotification)
- Operator typeId: `0x386072cc5a58e61263b434c722725f21031cd06e7c552cfaa06db5de8a320dbc` (LSP7Tokens_OperatorNotification)

**Force Parameter:**
- `force=false`: Transfer only succeeds if recipient implements LSP1 (safer, prevents accidental loss)
- `force=true`: Transfer always succeeds (allows EOAs and non-LSP1 contracts)

**Best Practice:** Use `force=false` by default to prevent accidental token loss.

### LSP8 - Identifiable Digital Asset
**Non-fungible token standard (improved ERC721/ERC1155) - "NFT 2.0".**

**Key Improvements:**
- **bytes32 tokenIds:** More flexible representation (not just uint256)
- **TokenId Formats:** Numbers, strings, addresses, unique bytes, hash digests
- **Unlimited Metadata:** Uses LSP4 for collection + per-tokenId metadata
- **Token Hooks (LSP1):** Notify sender and recipient on transfer
- **Force parameter:** Safety mechanism for transfers

**TokenId Format Options:**
- 0: uint256 (Number) - traditional incremental NFTs
- 1: string (String) - NFTs identified by names
- 2: address (Smart Contract) - each NFT is its own contract with logic
- 3: bytes32 (Unique Bytes) - 32-byte identifiers
- 4: bytes32 (Hash Digest) - hashed values for long strings
- 100+: Mixed formats (Value 102 = mixed with default as address)

**Token Hooks:**
- Sender typeId: `0xb23eae7e6d1564b295b4c3e3be402d9a2f0776c57bdf365903496f6fa481ab00` (LSP8Tokens_SenderNotification)
- Recipient typeId: `0x0b084a55ebf70fd3c06fd755269dac2212c4d3f0f4d09079780bfa50c1b2984d` (LSP8Tokens_RecipientNotification)
- Operator typeId: `0x468cd1581d7bc001c3b685513d2b929b55437be34700410383d58f3aa1ea0abc` (LSP8Tokens_OperatorNotification)

**Metadata Levels:**
- Collection-level: `setData(LSP4Metadata, ...)`
- TokenId-level: `setDataForTokenId(tokenId, LSP4Metadata, ...)`

**Force Parameter:** Same as LSP7 (false = safer, requires LSP1 implementation).

### Other LSP Standards (to explore further)

- **LSP1:** UniversalReceiver & UniversalReceiverDelegate
- **LSP2:** ERC725YJSONSchema (metadata format)
- **LSP3:** Profile-Metadata (Universal Profile metadata)
- **LSP4:** DigitalAsset-Metadata (token metadata)
- **LSP5:** ReceivedAssets (tracking received tokens)
- **LSP9:** Vault (secure asset container)
- **LSP10:** ReceivedVaults
- **LSP12:** IssuedAssets (tracking created tokens)
- **LSP14:** Ownable2Step
- **LSP17:** ContractExtension
- **LSP20:** CallVerification
- **LSP25:** ExecuteRelayCall (gas-less transactions)

## Developer Tools

### JavaScript Libraries

**erc725.js**
- Package: `@erc725/erc725.js`
- Purpose: Fetch/encode/decode ERC725Y metadata from UPs, tokens, NFTs
- Use: Reading and preparing metadata

**lsp-utils.js**
- Package: `@lukso/lsp-utils`
- Purpose: High-level helpers (getProfileMetadata, decodeAllowedCalls, decodeAllowedERC725YDataKeys)
- Use: Avoid low-level encoding/decoding

**eip191-signer.js**
- Package: `@lukso/eip191-signer.js`
- Purpose: Sign EIP-191 messages with private key
- Use: Preparing gas-less transactions for relayer

**@up-provider**
- Package: `@lukso/up-provider`
- Purpose: Build Universal Everything integrated mini-apps for Grid

**web3-onboard-config**
- Package: `@lukso/web3-onboard-config`
- Purpose: UP integration for Web3-Onboard
- Use: Connect UP to dApps

### Smart Contracts

**LSP Smart Contracts**
- GitHub: https://github.com/lukso-network/lsp-smart-contracts
- NPM: `@lukso/lsp-smart-contracts`
- Contains: Reference Solidity implementation of all LSP standards

**Foundry Template**
- GitHub: https://github.com/lukso-network/lukso-foundry-template
- Pre-installed with LSP contracts and examples

**Remix IDE Support**
- Write and deploy LSP contracts in browser

### APIs

**Relayer API**
- Deploy UPs easily
- Execute gas-free transactions (free monthly quota)

**Indexer API**
- Query UP and LSP7/8 Digital Asset information

**RPC API**
- UP Browser Extension endpoints

### Explorers

**Blockscout**
- Network explorer for LUKSO networks

**Txs.app**
- Human-readable transaction visualization

**Inspector Tool**
- Developer tool to retrieve metadata and permissions
- Encode/decode data

### Integrated Partners

**Envio**
- GraphQL indexer for UP and Digital Assets data
- Docs: https://docs.envio.dev/blog/envio-data-indexing-supports-developers-building-on-lukso

**DIA**
- Oracle with data feeds for LUKSO
- https://www.diadata.org/blog/lukso-partners-with-dia-oracles-mainnet/

**Dappnode**
- Run validator nodes, stake and earn rewards

**Gateway VRF**
- Verifiable Random Function coming to LUKSO

## Ecosystem dApps

### Stakingverse (stakingverse.io / app.stakingverse.io)
**Jordy's Project - LYX Liquid Staking Platform**

- **Purpose:** Liquid staking for LYX tokens on LUKSO
- **Key Features:**
  - Stake LYX and receive sLYX (staked LYX tokens)
  - Up to 8% APY with auto-compounding
  - Liquid staking token (sLYX) can be used in DeFi while earning rewards
  - Help secure the LUKSO network
  - Simple and secure staking interface
- **Services:** Also offers consultation and node setup services (stakingverse.io/services)
- **Tech:** Built on LUKSO, integrates with Universal Profiles

### Universal Everything (universaleverything.io)
- Explorer and wallet for Universal Profiles
- Primary interface for viewing and managing UPs

### Universal Swaps (universalswaps.io)
- Social DeFi for swaps and token liquidity
- DEX built for LUKSO ecosystem

### Universal Page (universal.page)
- NFT marketplace and staking solution
- Buy, sell, trade NFTs on LUKSO

### Common Ground (app.cg)
- Social app for web3 communities
- Web3-native social platform

### DeFolio (de-folio.com)
- Universal Profile management platform
- Tools for managing and analyzing your UP

### Airdrop Tool (airdropper.universaleverything.io)
- Distribute tokens to specific UPs
- Mass distribution tool for LSP7/LSP8 tokens

### Txs.app (txs.app)
- User-friendly transaction explorer
- Human-readable LUKSO blockchain explorer
- Decodes and visualizes transactions

## Key Concepts for Developers

### Universal Profile (UP)
- LSP0 ERC725Account + LSP3 Profile Metadata
- Smart contract-based account with metadata
- Controlled by LSP6 Key Manager
- Extensible, upgradable, notification-capable

### NFT 2.0
- LSP8 tokens with flexible tokenId representation
- Per-tokenId metadata
- Token hooks for sender/recipient awareness
- Force parameter for safety

### Permission System
- LSP6 Key Manager with granular permissions
- Multiple controllers with different access levels
- Restrictions via AllowedCalls and AllowedERC725YDataKeys
- SUPER permissions for trusted controllers

### Gas-less Transactions
- LSP25 ExecuteRelayCall
- Users sign, relayers execute and pay gas
- Enabled via EXECUTE_RELAY_CALL permission

### Metadata Flexibility
- ERC725Y key-value store
- LSP2 JSON Schema format
- Can add/update metadata after deployment
- IPFS for off-chain storage

## Resources

- **Docs:** https://docs.lukso.tech
- **Medium:** https://medium.com/lukso
- **GitHub:** https://github.com/lukso-network
- **Discord:** https://discord.com/invite/lukso
- **LIPs (Specs):** https://github.com/lukso-network/LIPs

## Common Questions & Answers

*(To be populated as I learn from community interactions)*

## Next Steps for Learning

- [ ] Deep dive into LSP1 UniversalReceiver and delegates
- [ ] Understand LSP2 ERC725YJSONSchema format in detail
- [ ] Learn LSP3 Profile Metadata structure
- [ ] Explore LSP4 DigitalAsset Metadata
- [ ] Study LSP5 ReceivedAssets tracking
- [ ] Understand LSP9 Vault use cases
- [ ] Read through LIP specs for formal specifications
- [ ] Study example dApps and integration patterns
- [ ] Review common pitfalls and best practices
- [ ] Explore Relayer API usage
- [ ] Understand Indexer API queries
- [ ] Learn deployment patterns (Foundry, Hardhat, Remix)

---

*Last updated: 2026-02-03*
