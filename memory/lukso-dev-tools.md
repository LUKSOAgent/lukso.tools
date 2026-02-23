# LUKSO Developer Tools and Resources

This document provides a comprehensive overview of the developer tools, resources, and repositories available for building on the LUKSO network.

## Overview

LUKSO is a blockchain network built on Ethereum's architecture that focuses on universal profiles, digital assets, and social interactions. The ecosystem provides a rich set of developer tools including smart contracts, CLI tools, JavaScript libraries, and comprehensive documentation.

## Key Repositories

### 1. LSP Smart Contracts Repository
**URL:** https://github.com/lukso-network/lsp-smart-contracts
**Purpose:** The reference smart contract implementation in Solidity for the LUKSO LSP Standards.

This repository contains the complete implementation of all LUKSO Standard Proposals (LSPs) as smart contracts. It includes:

#### Available NPM Packages:
- `@lukso/lsp0-contracts` - LSP0 ERC725Account
- `@lukso/lsp1-contracts` - LSP1 Universal Receiver
- `@lukso/lsp1delegate-contracts` - LSP1 Universal Receiver Delegate
- `@lukso/lsp2-contracts` - LSP2 ERC725Y JSON Schema
- `@lukso/lsp3-contracts` - LSP3 Profile Metadata
- `@lukso/lsp4-contracts` - LSP4 Digital Asset Metadata
- `@lukso/lsp5-contracts` - LSP5 Received Assets
- `@lukso/lsp6-contracts` - LSP6 Key Manager
- `@lukso/lsp7-contracts` - LSP7 Digital Asset
- `@lukso/lsp8-contracts` - LSP8 Identifiable Digital Asset
- `@lukso/lsp9-contracts` - LSP9 Vault
- `@lukso/lsp10-contracts` - LSP10 Received Vaults
- `@lukso/lsp11-contracts` - LSP11 Social Recovery
- `@lukso/lsp12-contracts` - LSP12 Issued Assets
- `@lukso/lsp14-contracts` - LSP14 Ownable 2 Step
- `@lukso/lsp16-contracts` - LSP16 Universal Factory
- `@lukso/lsp17-contracts` - LSP17 Extensions Package
- `@lukso/lsp17contractextension-contracts` - LSP17 Contract Extension Package
- `@lukso/lsp20-contracts` - LSP20 Call Verification
- `@lukso/lsp23-contracts` - LSP23 Linked Contracts Factory
- `@lukso/lsp25-contracts` - LSP25 Execute Relay Call
- `@lukso/lsp26-contracts` - LSP26 Follower System
- `@lukso/universalprofile-contracts` - Universal Profile

#### Installation:
```bash
# Install all LSP smart contracts
npm install @lukso/lsp-smart-contracts

# Install specific LSP package
npm install @lukso/lsp7-contracts
```

#### Usage:
The contracts can be used for building decentralized applications on LUKSO, implementing features like universal profiles, digital assets, and social recovery mechanisms.

### 2. LUKSO CLI Tools Repository
**URL:** https://github.com/lukso-network/tools-lukso-cli
**Purpose:** Command line tool to install, manage and set up validators of different clients for the LUKSO Blockchain.

#### Key Features:
- Installation of Execution, Consensus, and Validator Clients
- Running a node as a validator
- Accessing various client logs
- Support for multiple EVM clients

#### Supported Clients:
**Execution Clients:** Geth, Erigon, Nethermind, Besu
**Consensus Clients:** Prysm, Lighthouse, Teku, Nimbus (eth-2)
**Validator Clients:** Prysm, Lighthouse, Teku

#### Installation:
```bash
# Download and install LUKSO CLI
curl https://install.lukso.network | sh
```

#### Key Commands:
- `lukso init` - Initialize working directory
- `lukso install` - Install chosen clients
- `lukso start` - Start all or specific clients
- `lukso stop` - Stop running clients
- `lukso status` - Check node status
- `lukso logs` - View client logs
- `lukso validator import` - Import validator keys
- `lukso validator list` - List imported validator keys
- `lukso validator exit` - Exit validator

### 3. Documentation Repository
**URL:** https://github.com/lukso-network/docs
**Purpose:** LUKSO technical documentation website built with Docusaurus 3.

**Live Documentation:** https://docs.lukso.tech/

The documentation includes:
- Network parameters and configuration
- Tool documentation
- Smart contract guides
- Integration tutorials
- API references

## JavaScript Libraries and Tools

### Core Libraries:

#### 1. erc725.js
**Package:** `@erc725/erc725.js`
**Purpose:** Fetch metadata from Universal Profiles, Tokens and NFTs. Includes helper functions to encode and prepare metadata.

```bash
npm install @erc725/erc725.js
```

#### 2. lsp-utils.js
**Package:** `@lukso/lsp-utils`
**Purpose:** High-level helper functions for working with LUKSO profiles and assets.

```bash
npm install @lukso/lsp-utils
```

#### 3. eip191-signer.js
**Package:** `@lukso/eip191-signer.js`
**Purpose:** Sign EIP-191 messages with private keys for gas-less transactions.

```bash
npm install @lukso/eip191-signer.js
```

#### 4. Universal Profile Provider
**Package:** `@lukso/up-provider`
**Purpose:** Build Universal Everything integrated mini-apps for Grid.

```bash
npm install @lukso/up-provider
```

#### 5. Web3 Onboard Config
**Package:** `@lukso/web3-onboard-config`
**Purpose:** Universal Profile Integration for Web3-Onboard.

```bash
npm install @lukso/web3-onboard-config
```

## Network Information

### Mainnet Parameters:
- **Network Name:** LUKSO
- **Chain ID:** 42
- **Currency Symbol:** LYX
- **RPC URL:** https://42.rpc.thirdweb.com
- **Block Explorer:** https://explorer.lukso.network

### Third-party RPC Providers:
- Thirdweb: https://42.rpc.thirdweb.com
- SigmaCore: https://rpc.lukso.sigmacore.io (requires API key)
- NowNodes: https://lukso.nownodes.io (requires API key)
- Envio: https://lukso.rpc.hypersync.xyz (optimized read-only)

## Development Tools

### 1. Foundry Template
**URL:** https://github.com/lukso-network/lukso-foundry-template
Pre-configured Foundry repository with LSP smart contracts package and example contracts.

### 2. Remix IDE Integration
Documentation available for working with LSP smart contracts in Remix IDE.

### 3. ERC725 Inspector Tool
Web-based tool for retrieving metadata and permissions from Universal Profiles and Digital Assets.

## APIs and Services

### 1. Relayer API
Deploy Universal Profiles easily and execute gas-free transactions with monthly gas quotas.

### 2. Indexer API
Query information about Universal Profiles and LSP7/8 Digital Assets.

### 3. RPC API
Available RPC endpoints for the Universal Profile Browser Extension.

## Integrated Partners

### Data Indexing:
- **Envio:** GraphQL indexer for Universal Profiles and Digital Assets
- **Endpoint:** https://envio.lukso-mainnet.universal.tech/v1/graphql

### Oracle Services:
- **DIA:** Oracle with data feeds for LUKSO

### Infrastructure:
- **Dappnode:** Validator node management
- **Gateway VRF:** Verifiable Random Function services

## IPFS Storage

For production applications, developers should use their own IPFS gateway solutions:
- **Pinata:** https://docs.pinata.cloud/docs/welcome-to-pinata
- **Infura:** https://docs.infura.io/networks/ipfs

**Development Gateway:** https://api.universalprofile.cloud/ipfs (for development only, no SLA guaranteed)

## How to Use These Tools

### For Smart Contract Development:
1. Install `@lukso/lsp-smart-contracts` package
2. Use the Foundry template for quick setup
3. Reference the documentation for specific LSP implementations
4. Use Remix IDE for quick prototyping

### For dApp Development:
1. Use `erc725.js` for metadata handling
2. Implement `lsp-utils.js` for high-level operations
3. Integrate `@lukso/web3-onboard-config` for wallet connections
4. Use the Relayer API for gas-less transactions

### For Node Operations:
1. Install LUKSO CLI
2. Initialize working directory with `lukso init`
3. Install preferred clients with `lukso install`
4. Start node with `lukso start`
5. Monitor with `lukso status` and `lukso logs`

### For Data Querying:
1. Use Envio indexer for GraphQL queries
2. Access Universal Profile data via the Indexer API
3. Use Blockscout explorer for transaction details
4. Monitor network activity with Txs.app

## Security and Audits

The LSP smart contracts have undergone multiple security audits:
- Chainsulting Audit (July 2022)
- Quantstamp Audit (September 2022)
- Watchpug Audits (October 2022, December 2022, April 2023)
- Runtime Verification - Formal Verification (February 2023)
- Trust Audit (April 2023)
- Code4Rena Audit Contest (June-July 2023)
- MiloTruck Audits (November 2023, January 2024)

All audit reports are available in the `audits/` folder of the lsp-smart-contracts repository.

## Getting Started

1. **Set up development environment** using the Foundry template
2. **Install required packages** based on your use case
3. **Connect to LUKSO network** using one of the RPC providers
4. **Reference the documentation** at https://docs.lukso.tech/
5. **Join the community** for support and updates

## Additional Resources

- **Network Status:** https://stats.execution.mainnet.lukso.network
- **Client Diversity Dashboard:** https://clientdiversity.lukso.network
- **Validator Launchpad:** https://deposit.mainnet.lukso.network
- **Checkpoints:** https://checkpoints.mainnet.lukso.network

This comprehensive toolkit provides everything needed to build sophisticated decentralized applications on the LUKSO network, from basic smart contract deployment to complex universal profile management and digital asset operations.