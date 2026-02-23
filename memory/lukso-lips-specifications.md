# LUKSO Improvement Proposals (LIPs) and LSP Specifications Study

## Overview

The LUKSO Improvement Proposals (LIPs) repository at https://github.com/lukso-network/LIPs serves as the central hub for documenting standards and specifications for the LUKSO blockchain platform. This repository contains both LUKSO Improvement Proposals (LIPs) and LUKSO Standard Proposals (LSPs), which together form the technical foundation of the LUKSO ecosystem.

## Standards Development Process

### LIP Status Lifecycle

The LUKSO standards development process follows a structured lifecycle with the following stages:

- **Draft** - An LIP undergoing rapid iteration and changes
- **Review** - An LIP marked as ready for peer review  
- **Last Call** - An LIP ready for review by a wide audience
- **Accepted** - A core LIP that has been in Last Call for at least 2 weeks with technical changes addressed
- **Final (non-Core)** - An LIP that has been in Last Call for at least 2 weeks with technical changes addressed
- **Final (Core)** - An LIP that Core Devs have decided to implement in a future hard fork
- **Deferred** - An LIP not being considered for immediate adoption

### LIP Types

1. **Standard Track LIPs** - Changes affecting most LUKSO implementations
   - **Core** - Consensus fork improvements
   - **Interface** - Client API/RPC specifications
   - **LSP** - Application-level standards and smart contract standards

2. **Informational LIPs** - General guidelines or information

3. **Meta LIPs** - Process changes and governance

## LSP Specifications in Detail

### Core Account Standards

#### LSP-0: ERC725Account (Draft)
- **Interface ID**: 0x24871b3d
- **Purpose**: The foundational digital identity standard for LUKSO blockchain
- **Key Features**:
  - Dynamic information attachment via ERC725Y
  - Generic execution capabilities via ERC725X
  - Signature verification via ERC1271
  - Universal receiver notifications via LSP1
  - Secured ownership management via LSP14
  - Future-proof functionality via LSP17
  - Streamlined account interaction via LSP20

**Technical Specifications**:
- Combines ERC725X (execution) and ERC725Y (data storage) standards
- Supports batch call execution
- Implements universal receiver for notification handling
- Allows contract extensions for future functionality
- Provides graffiti capability for arbitrary message sending
- Uses multi-step ownership transfer process

**Key Data Keys**:
- `LSP1UniversalReceiverDelegate`: 0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbdf6277f3cc0730c45b828b6db8b47
- `LSP17Extension:<bytes4>`: 0xcee78b4094da860110960000<functionSelector>

#### LSP-1: UniversalReceiver (Draft)
- **Interface ID**: 0x6bb56a14
- **Delegate Interface ID**: 0xa245bbda
- **Purpose**: Enables contracts to receive and react to arbitrary information
- **Key Features**:
  - Generic notification system for incoming transfers/interactions
  - Delegation to external contracts for upgradeable behavior
  - Type-based reaction system using typeId parameters
  - Integration with LSP1-UniversalReceiverDelegate contracts

**Core Function**:
```solidity
function universalReceiver(bytes32 typeId, bytes memory data) external payable returns (bytes memory)
```

#### LSP-2: ERC725YJSONSchema (Draft)
- **Purpose**: Standardizes data key-value pairs for ERC725Y smart contracts
- **Key Types**:
  - **Singleton**: Simple data keys (bytes32(keccak256("KeyName")))
  - **Array**: Unlimited element arrays with pagination support
  - **Mapping**: Two-section keys with dynamic values
  - **MappingWithGrouping**: Three-section keys for complex data structures

**Value Types**: Supports bool, string, address, uintN, bytesN, arrays, tuples, and compact bytes arrays
**Value Contents**: Defines interpretation (Boolean, String, Address, Number, BitArray, VerifiableURI, etc.)

### Permission and Access Control

#### LSP-6: KeyManager (Draft)
- **Interface ID**: 0x23f34c62
- **Purpose**: Permission-based access control system for ERC725 accounts
- **Key Features**:
  - Granular permission system with 255 possible permissions
  - Multi-controller support for shared account management
  - Call restrictions (allowed addresses, functions, interface IDs)
  - Data key restrictions for setData operations
  - Relay call support for meta-transactions
  - Batch execution capabilities

**Core Permissions**:
- `CHANGEOWNER` (0x0000000000000000000000000000000000000000000000000000000000000001)
- `SETDATA` (0x0000000000000000000000000000000000000000000000000000000000040000)
- `CALL` (0x0000000000000000000000000000000000000000000000000000000000000800)
- `TRANSFERVALUE` (0x0000000000000000000000000000000000000000000000000000000000000200)
- `SIGN` (0x0000000000000000000000000000000000000000000000000000000000200000)

**Key Data Keys**:
- `AddressPermissions[]`: Array of permissioned addresses
- `AddressPermissions:Permissions:<address>`: Permission bit array for each address
- `AddressPermissions:AllowedCalls:<address>`: Call restrictions
- `AddressPermissions:AllowedERC725YDataKeys:<address>`: Data key restrictions

### Meta-Transaction Standards

#### LSP-25: ExecuteRelayCall (Draft)
- **Interface ID**: 0x5ac79908
- **Purpose**: Standardized meta-transaction interface for gasless transactions
- **Key Features**:
  - Multi-channel nonce system for out-of-order execution
  - EIP-191 signature format with LSP25-specific parameters
  - Batch relay call support
  - Validity timestamps for transaction expiration
  - Version 25 specification identifier

**Signature Format**:
```
0x19 <0x00> <Implementation address> <LSP25_VERSION> <chainId> <nonce> <validityTimestamps> <value> <calldata>
```

**Multi-Channel Nonces**: Uses uint256 with left 128 bits for channelId and right 128 bits for nonceId

### Asset and Metadata Standards

#### LSP-3: Profile-Metadata (Draft)
- **Purpose**: Metadata standard for Universal Profiles
- **Key Data Keys**:
  - `LSP3Profile`: Profile metadata storage
  - `LSP3IssuedAssets[]`: Array of assets issued by the profile

#### LSP-4: DigitalAsset-Metadata (Draft)
- **Purpose**: Metadata standard for digital assets
- **Key Data Keys**:
  - `LSP4TokenName`: Asset name
  - `LSP4TokenSymbol`: Asset symbol
  - `LSP4Metadata`: Asset metadata

#### LSP-7: DigitalAsset (Draft)
- **Purpose**: Fungible token standard
- **Features**: Supply management, transfer restrictions, metadata support

#### LSP-8: IdentifiableDigitalAsset (Draft)
- **Purpose**: Non-fungible token standard
- **Features**: Unique token identification, metadata per token, enumerable interface

### Social and Utility Standards

#### LSP-26: FollowerSystem (Draft)
- **Official Address**: 0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA
- **Purpose**: Decentralized follower registry for social interactions
- **Key Features**:
  - Follow/unfollow functionality with batch operations
  - Follower and following count tracking
  - Pagination support for large lists
  - LSP1 notification hooks
  - Universal deployment across EVM chains

**Core Functions**:
- `follow(address addr)`: Follow a specific address
- `unfollow(address addr)`: Unfollow a specific address
- `getFollowsByIndex(address addr, uint256 startIndex, uint256 endIndex)`: Paginated following list
- `getFollowersByIndex(address addr, uint256 startIndex, uint256 endIndex)`: Paginated followers list

**Events**:
- `Follow(address follower, address addr)`
- `Unfollow(address unfollower, address addr)`

### Infrastructure and Extension Standards

#### LSP-14: Ownable2Step (Draft)
- **Purpose**: Two-step ownership transfer process
- **Features**: Pending owner mechanism, secure ownership transitions

#### LSP-17: ContractExtension (Draft)
- **Purpose**: Post-deployment functionality extension
- **Features**: Function selector mapping, extension address storage, value forwarding support

#### LSP-20: CallVerification (Draft)
- **Purpose**: Unified interaction interface for complex ownership structures
- **Features**: Permission verification, call forwarding, result verification

## Recent Proposals and Changes

### Active Development Areas

1. **Social Infrastructure**: LSP-26 FollowerSystem represents a significant step toward on-chain social interactions
2. **Meta-Transactions**: LSP-25 ExecuteRelayCall enables gasless transactions for better UX
3. **Permission Systems**: LSP-6 KeyManager provides sophisticated access control
4. **Account Abstraction**: LSP-0 ERC725Account serves as the foundation for smart contract accounts

### Technical Innovations

1. **Multi-Channel Nonces**: LSP-25 introduces parallel transaction execution channels
2. **Universal Receiver Pattern**: LSP-1 provides standardized notification handling
3. **JSON Schema Standardization**: LSP-2 enables structured data storage and interpretation
4. **BitArray Permissions**: LSP-6 uses efficient bit-packed permission systems

## Standards Development Process

### Contribution Guidelines

1. **Community Involvement**: Standards are discussed in Discord and GitHub issues
2. **Technical Review**: Each proposal undergoes peer review before advancement
3. **Implementation Requirements**: Draft standards require reference implementations
4. **Documentation**: Comprehensive specifications with examples and rationale

### Quality Standards

- All LSPs must include ERC165 interface compliance
- Specifications must include detailed technical documentation
- Reference implementations are required for advancement
- Security considerations must be explicitly addressed
- Backwards compatibility analysis where applicable

## Key Technical Specifications Not in Main Documentation

### Advanced Features

1. **LSP0 Value Reception**: Native token transfers trigger UniversalReceiver events
2. **Extension System**: Post-deployment functionality addition via LSP17
3. **Call Verification**: Complex ownership structure abstraction via LSP20
4. **Batch Operations**: Efficient multi-operation execution across standards

### Security Considerations

1. **Delegatecall Safety**: Explicit warnings about delegatecall usage
2. **Signature Replay Protection**: EIP-191 compliance with chain-specific parameters
3. **Permission Validation**: Multi-layer permission checking in LSP-6
4. **Reentrancy Guards**: Built-in protection against reentrancy attacks

### Interoperability Features

1. **ERC165 Compliance**: All LSPs implement interface detection
2. **Standardized Events**: Consistent event emission across standards
3. **Data Key Conventions**: LSP2 provides structured data storage
4. **Cross-Standard Integration**: Standards reference and build upon each other

## Implementation Status

### Current Implementations

- **lukso-network/lsp-smart-contracts**: Primary implementation repository
- **Universal Profile**: Production deployment of LSP-0, LSP-1, LSP-3, LSP-6
- **Follower System**: LSP-26 deployed at 0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA

### Development Activity

- 29 contributors to the LIPs repository
- 1,147 commits with active development
- 45 forks indicating community interest
- 98 stars showing adoption traction

## Future Outlook

### Emerging Patterns

1. **Social Layer**: Building decentralized social infrastructure
2. **User Experience**: Gasless transactions and simplified interactions
3. **Security**: Advanced permission systems and access control
4. **Extensibility**: Post-deployment upgrade mechanisms

### Integration Opportunities

- Cross-chain compatibility via standardized interfaces
- Developer tooling for LSP implementation
- Wallet integration for Universal Profiles
- Application frameworks leveraging LSP standards

This comprehensive study reveals LUKSO's systematic approach to building a complete blockchain ecosystem focused on digital identity, social interaction, and user experience. The LSP standards provide a robust foundation for next-generation decentralized applications while maintaining compatibility with existing Ethereum infrastructure.