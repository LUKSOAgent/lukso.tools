# LUKSO LSP Standards Complete Documentation

## Introduction

This document provides a comprehensive overview of all LUKSO Standard Proposals (LSPs), representing the foundation of LUKSO's ecosystem. These standards serve as building blocks for creating blockchain-based applications that maximize user experience, allow flexibility and interaction, and enable innovation.

**Key Concepts:**
- Blockchain-based accounts (Universal Profiles)
- Digital Assets and NFT 2.0
- Permissions Management
- Decentralized ownership and control

**Note:** LSPs are not order-dependent and can be related to each other in backward or forward order.

---

## Complete LSP Standards Overview

### LSP0 - ERC725 Account
**Category:** Accounts & Interactions
**Purpose:** Blockchain account for asset ownership and use by individuals or entities.
**Key Features:**
- Foundation of Universal Profiles - digital identity system
- Combines ERC725X (generic executor) and ERC725Y (generic key-value store)
- Supports ERC1271 for signature verification
- Implements LSP1 UniversalReceiver for notifications
- Uses LSP14 for secure 2-step ownership management
- Extensible via LSP17 Contract Extension
- Unified interaction via LSP20 Call Verification

**Technical Composition:**
- ERC165: Interface detection
- ERC725X: Generic executor (CALL, CREATE, CREATE2, STATICCALL, DELEGATECALL)
- ERC725Y: Generic key-value store for arbitrary data
- ERC1271: Signature validation
- LSP1: UniversalReceiver for incoming/outgoing transaction notifications
- LSP14: Secure 2-step ownership transfers
- LSP17: Contract extension capabilities
- LSP20: Unified call verification

### LSP1 - Universal Receiver
**Category:** Accounts & Interactions
**Purpose:** Notification receiver for incoming and outgoing transactions or information.
**Key Features:**
- Unified notification system for smart contracts
- Single function `universalReceiver(bytes32 typeId, bytes data)`
- Emits UniversalReceiver event with transaction details
- Supports custom logic for different notification types
- Extensible via UniversalReceiverDelegate contracts

**Use Cases:**
- Token transfer notifications
- Asset reception alerts
- Custom reaction to incoming transactions
- Automatic token forwarding or rejection
- Integration with DeFi protocols

### LSP2 - ERC725Y JSON Schema
**Category:** Metadata
**Purpose:** Describes ERC725Y data key-value pairs interpretation including encoding and decoding.
**Key Features:**
- Standardized JSON schema for smart contract storage
- Defines data key types: Singleton, Array, Mapping, MappingWithGrouping
- Specifies encoding formats for different data types
- Enables cross-contract data interoperability
- Supports VerifiableURI for tamper-proof off-chain data

**Data Key Types:**
- **Singleton**: Single unique values
- **Array**: Ordered lists with index access
- **Mapping**: Key-value lookups (addresses, bytes32, etc.)
- **MappingWithGrouping**: Hierarchical mappings with sub-types

### LSP3 - Profile Metadata
**Category:** Metadata
**Purpose:** Set of ERC725Y data keys describing a smart contract based blockchain profile.
**Key Features:**
- Defines metadata schema for Universal Profiles
- Standardized profile information structure
- Supports profile images, descriptions, and links
- Extensible for custom profile data

### LSP4 - Digital Asset Metadata
**Category:** Tokens & NFTs
**Purpose:** Describes metadata of digital assets via a set of ERC725Y data keys.
**Key Features:**
- Extensible metadata for tokens and NFTs
- Supports creators, community information
- Enables metadata updates over time
- Works with both LSP7 and LSP8 assets

### LSP5 - Received Assets
**Category:** Metadata
**Purpose:** Defines ERC725Y data keys storing addresses of received assets.
**Key Features:**
- Tracks assets owned by Universal Profiles
- Automatic asset discovery
- Standardized asset list management
- Integration with LSP1 notifications

### LSP6 - Key Manager
**Category:** Ownership & Access Control
**Purpose:** Contract with permissions controlled through multiple addresses.
**Key Features:**
- Multi-controller permission system
- Granular permission types (16+ different permissions)
- Super permissions for unrestricted access
- Allowed calls and data key restrictions
- Supports both direct and relay execution
- Integration with LSP20 for unified interactions

**Permission Types:**
- Basic: CHANGEOWNER, ADDCONTROLLER, EDITPERMISSIONS
- Extensions: ADDEXTENSIONS, CHANGEEXTENSIONS
- UniversalReceiver: ADDUNIVERSALRECEIVERDELEGATE, CHANGEUNIVERSALRECEIVERDELEGATE
- Operations: TRANSFERVALUE, CALL, STATICCALL, DELEGATECALL, DEPLOY
- Data: SETDATA, ENCRYPT, DECRYPT, SIGN
- Execution: EXECUTE_RELAY_CALL, REENTRANCY

### LSP7 - Digital Asset
**Category:** Tokens & NFTs
**Purpose:** Standard for fungible or non-fungible digital assets with a unified interface.
**Key Features:**
- Divisible and non-divisible token modes
- Unlimited metadata via LSP4
- LSP1 token hooks for sender/recipient notifications
- Force parameter for secure transfers
- Unified interface for all asset types
- Based on ERC20/ERC777 with enhancements

**Token Types:**
- **Divisible**: Fractional tokens with decimals (up to 18)
- **Non-divisible**: Whole units only (like tickets, collectibles)

### LSP8 - Identifiable Digital Asset
**Category:** Tokens & NFTs
**Purpose:** Interface for uniquely identifiable digital assets with specific metadata.
**Key Features:**
- bytes32 tokenIds for flexible representation
- Multiple tokenId formats: Number, String, Address, bytes32, Hash
- Per-tokenId metadata support
- LSP1 token hooks
- Mixed format collections supported
- Advanced NFT 2.0 capabilities

**TokenId Formats:**
- **0**: uint256 (numbers)
- **1**: string (names, up to 32 chars)
- **2**: address (smart contract tokens)
- **3**: bytes32 (unique identifiers)
- **4**: bytes32 (hash digests)

### LSP9 - Vault
**Category:** Accounts & Interactions
**Purpose:** ERC725 smart contract variant representing a blockchain vault.
**Key Features:**
- Asset storage and management
- Interaction isolation for security
- ERC725X execution capabilities
- ERC725Y data storage
- LSP1 notification support
- LSP14 ownership management
- Controlled third-party access

**Use Cases:**
- Protocol asset segregation
- Multi-signature asset storage
- Time-locked asset management
- Third-party integration security

### LSP10 - Received Vaults
**Category:** Metadata
**Purpose:** ERC725Y keys to list owned LSP9 Vaults.
**Key Features:**
- Tracks vault ownership
- Automatic vault discovery
- Standardized vault management
- Integration with Universal Profiles

### LSP11 - Basic Social Recovery
**Category:** (GitHub)
**Purpose:** Contract that enables to recover access to any ERC725-based smart contract
**Key Features:**
- Social recovery mechanism
- Guardian-based account recovery
- ERC725 account support
- Multi-signature recovery process

### LSP12 - Issued Assets
**Category:** Metadata
**Purpose:** List of issued assets by an individual or entity via ERC725Y keys.
**Key Features:**
- Tracks assets created by profiles
- Creator attribution system
- Asset authenticity verification
- Integration with LSP4 metadata

### LSP14 - Ownable 2 Steps
**Category:** Ownership & Access Control
**Purpose:** Module for secure two-step ownership management of smart contracts.
**Key Features:**
- Two-step ownership transfer process
- Pending owner acceptance requirement
- Two-step ownership renouncement (200 blocks)
- LSP1 notification hooks
- Enhanced security against accidental transfers

**Process:**
1. **Transfer**: Current owner initiates → New owner accepts
2. **Renounce**: Owner initiates → 200 block wait → Owner confirms

### LSP15 - Transaction Relayer API
**Category:** Accounts & Interactions
**Purpose:** A standard set of API methods to create a service that acts as a relayer and dispatch transactions on behalf of users.
**Key Features:**
- Gasless transaction support
- Relay service standardization
- Meta-transaction capabilities
- User experience improvement

### LSP16 - Universal Factory
**Category:** Factories
**Purpose:** Factory that facilitates the deployment of smart contracts at the same address across multiple chains.
**Key Features:**
- Cross-chain deployment consistency
- CREATE2 deterministic deployment
- Multi-chain contract addressing
- Universal deployment standard

### LSP17 - Contract Extension
**Category:** Accounts & Interactions
**Purpose:** Extends smart contract functionalities with addable and removable plugins.
**Key Features:**
- Post-deployment extensibility
- Plugin-based architecture
- Function and interface addition
- Upgradeable contract capabilities

### LSP18 - Royalties
**Category:** (GitHub)
**Purpose:** Set of data keys to store information about royalty recipient addresses and their claimable percentage.
**Key Features:**
- Creator royalty management
- Flexible royalty distribution
- Multi-recipient support
- Integration with asset standards

### LSP20 - Call Verification
**Category:** Accounts & Interactions
**Purpose:** Facilitates smart contract interactions without resolving the owner first.
**Key Features:**
- Unified interaction interface
- Owner verification abstraction
- Direct contract calling
- Enhanced user experience

### LSP23 - Linked Contracts Factory
**Category:** Factories
**Purpose:** Factory pattern standard for deploying two linked contracts across chains.
**Key Features:**
- Dual contract deployment
- Cross-chain consistency
- Linked contract relationships
- Deterministic deployment

### LSP25 - Execute Relay Call
**Category:** (Contracts)
**Purpose:** Generic interface for meta transactions, so that interactions and gas can be paid on behalf of users.
**Key Features:**
- Meta-transaction standard
- Gas fee abstraction
- Relay call execution
- Multi-channel nonce support

### LSP26 - Follower System
**Category:** Accounts & Interactions
**Purpose:** Contract that act as a registry that keep track of a list of addresses that follow each other for social interactions.
**Key Features:**
- On-chain social graph
- Follow/unfollow functionality
- Batch operations support
- LSP1 integration for notifications
- Pagination for large lists
- Deployed at consistent address across chains

**Core Functions:**
- `follow(address addr)`: Follow an address
- `unfollow(address addr)`: Unfollow an address
- `followBatch(address[] memory addresses)`: Batch follow
- `unfollowBatch(address[] memory addresses)`: Batch unfollow

**Query Functions:**
- `isFollowing(address follower, address addr)`: Check follow status
- `followerCount(address addr)`: Get follower count
- `followingCount(address addr)`: Get following count
- `getFollowsByIndex()`: Paginated following list
- `getFollowersByIndex()`: Paginated followers list

---

## LSP Standards Relationships

### Foundation Layer
- **ERC725**: Foundation standard (LSP0 base)
- **LSP2**: Data schema standard (used by all metadata)

### Account Layer
- **LSP0**: Universal Profile foundation
- **LSP1**: Universal Receiver (notifications)
- **LSP6**: Key Manager (permissions)
- **LSP9**: Vault (asset storage)

### Asset Layer
- **LSP4**: Asset metadata
- **LSP7**: Fungible assets
- **LSP8**: Non-fungible assets

### Utility Layer
- **LSP14**: Secure ownership
- **LSP17**: Contract extensions
- **LSP20**: Call verification
- **LSP26**: Social features

---

## Most Important Standards by Use Case

### For Digital Identity & Profiles
1. **LSP0** - Universal Profile foundation
2. **LSP1** - Universal Receiver for notifications
3. **LSP6** - Key Manager for permissions
4. **LSP3** - Profile metadata

### For Token Creation
1. **LSP7** - Digital assets (fungible)
2. **LSP8** - Identifiable digital assets (NFTs)
3. **LSP4** - Asset metadata
4. **LSP12** - Issued assets tracking

### For Security & Access Control
1. **LSP6** - Key Manager (permissions)
2. **LSP14** - Ownable 2-step (ownership)
3. **LSP9** - Vault (asset isolation)
4. **LSP11** - Social recovery

### For Interoperability
1. **LSP2** - JSON Schema (data standardization)
2. **LSP1** - Universal Receiver (notifications)
3. **LSP20** - Call Verification (unified interactions)
4. **LSP5** - Received assets (asset tracking)

### For Advanced Features
1. **LSP17** - Contract Extension (upgradeability)
2. **LSP15** - Transaction Relayer (gasless)
3. **LSP16** - Universal Factory (deployment)
4. **LSP26** - Follower System (social features)

---

## Technical Implementation Notes

### Gas Optimization
- Super permissions skip restriction checks for cheaper transactions
- Batch operations available in multiple standards
- CompactBytesArray format for efficient data storage

### Security Considerations
- LSP14 prevents accidental ownership transfers
- LSP9 isolates protocol interactions
- Force parameter in LSP7/LSP8 prevents accidental token loss
- Reentrancy protection in LSP6

### Cross-Chain Compatibility
- LSP16 ensures same addresses across chains
- LSP23 for linked contract deployments
- Consistent LSP26 deployment addresses

---

## References & Resources

- **Official LUKSO Standards**: https://github.com/lukso-network/LIPs
- **Solidity Implementations**: https://github.com/lukso-network/lsp-smart-contracts
- **Developer Documentation**: https://docs.lukso.tech/
- **JavaScript Library**: erc725.js for data encoding/decoding
- **LUKSO Mainnet**: Standards deployed and active

---

*This documentation covers all LSP standards from LSP0 through LSP26+ as of the latest updates. Standards are continuously evolving, with new ones being developed to address emerging blockchain use cases.*