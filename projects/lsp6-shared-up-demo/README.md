# LSP6 Shared Universal Profile / Mini-DAO Demo

A complete demonstration of multiple EOAs acting as controllers for a single Universal Profile with granular permissions using LSP6 KeyManager. This creates a mini-DAO structure where different agents (like OpenClaw sub-agents) can have specific roles and permissions.

## Overview

This project demonstrates:
- **Shared Universal Profile**: One UP controlled by multiple EOAs
- **Granular Permissions**: Different controllers with different permission levels
- **Mini-DAO Structure**: Agents with roles like Executor, Data Manager, Signer
- **Batch Transactions**: Multiple operations in a single transaction
- **Relay Call Pattern**: Gasless transactions via relayers
- **Controller Management**: Adding/removing controllers dynamically

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIVERSAL PROFILE                         │
│                     (LSP0ERC725Account)                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 LSP6 KeyManager                     │    │
│  │              (Permission Controller)                │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│           ┌──────────────┼──────────────┐                   │
│           ▼              ▼              ▼                   │
│    ┌──────────┐   ┌──────────┐   ┌──────────┐              │
│    │  Agent   │   │  Agent   │   │  Agent   │              │
│    │  Alpha   │   │  Beta    │   │  Gamma   │              │
│    │(Executor)│   │(Data Mgr)│   │ (Signer) │              │
│    └──────────┘   └──────────┘   └──────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Permission Structure

| Controller | Role | Permissions |
|------------|------|-------------|
| Deployer | Admin | ALL (0xfff) |
| Agent Alpha | Executor | EXECUTE + EXECUTE_CALL (0x300) |
| Agent Beta | Data Manager | SETDATA + SUPER_SETDATA (0xc00) |
| Agent Gamma | Signer | SIGN (0x1000) |
| Agent Delta | Limited | EXECUTE only (0x100) |

## Installation

```bash
# Clone the repository (or use the files directly)
cd projects/lsp6-shared-up-demo

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings (optional for local testing)
```

## Usage

### Local Testing (Hardhat Network)

```bash
# Start local Hardhat node
npx hardhat node

# In another terminal, run the demo
npx hardhat run scripts/demo.ts --network localhost
```

### LUKSO Testnet

```bash
# Set your private key in .env
# PRIVATE_KEY=your_private_key_without_0x

# Run on LUKSO testnet
npx hardhat run scripts/demo.ts --network luksoTestnet
```

## Demo Features

### 1. Shared UP Deployment
- Deploys a Universal Profile
- Deploys LSP6 KeyManager
- Transfers ownership to KeyManager

### 2. Controller Creation
Creates 3 EOAs simulating OpenClaw sub-agents:
- **Agent Alpha**: Can execute transactions
- **Agent Beta**: Can set data on the UP
- **Agent Gamma**: Can sign messages

### 3. Permission Configuration
Uses LSP6 permission keys (`0x4b80742d00000000c6dd0000<address>`) to set granular permissions for each controller.

### 4. Batch Transactions
Demonstrates executing multiple operations in a single transaction:
- Send ETH to multiple recipients
- Set data on the UP
- All executed through the shared account

### 5. Relay Call Pattern
Shows how a relayer can execute transactions on behalf of controllers:
- Controller signs a message
- Relayer submits and pays gas
- Enables gasless transactions

### 6. Controller Management
Demonstrates adding new controllers dynamically with specific permissions.

## Permission Bitmasks

```typescript
// LSP6 Permission Values
const PERMISSIONS = {
  CHANGE_OWNER:   0x0000000000000000000000000000000000000000000000000000000000000001,
  ADD_CONTROLLER: 0x0000000000000000000000000000000000000000000000000000000000000002,
  EDIT_PERMISSIONS: 0x0000000000000000000000000000000000000000000000000000000000000004,
  ADD_EXTENSION:  0x0000000000000000000000000000000000000000000000000000000000000008,
  CHANGE_EXTENSION: 0x0000000000000000000000000000000000000000000000000000000000000010,
  
  EXECUTE:        0x0000000000000000000000000000000000000000000000000000000000000100,
  EXECUTE_CALL:   0x0000000000000000000000000000000000000000000000000000000000000200,
  SETDATA:        0x0000000000000000000000000000000000000000000000000000000000000400,
  SUPER_SETDATA:  0x0000000000000000000000000000000000000000000000000000000000000800,
  SIGN:           0x0000000000000000000000000000000000000000000000000000000000001000,
  BATCH_CALLS:    0x0000000000000000000000000000000000000000000000000000000000002000,
  
  // Combined roles
  ADMIN:          0x0000000000000000000000000000000000000000000000000000000000000fff,
  EXECUTOR:       0x0000000000000000000000000000000000000000000000000000000000000300,
  DATA_MANAGER:   0x0000000000000000000000000000000000000000000000000000000000000c00,
};
```

## Project Structure

```
lsp6-shared-up-demo/
├── contracts/              # Solidity contracts (if needed)
├── scripts/
│   ├── demo.ts            # Main demo script
│   └── demo-simple.ts     # Simplified version
├── screenshots/           # Demo screenshots
├── test/                  # Test files
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
├── hardhat.config.ts     # Hardhat configuration
├── package.json          # Dependencies
└── README.md             # This file
```

## Key Files

### `scripts/demo.ts`
Main demo script demonstrating:
- Deployment
- Controller setup
- Permission configuration
- Batch transactions
- Relay calls
- Controller management

### `hardhat.config.ts`
Network configuration for:
- Local Hardhat network
- LUKSO Testnet (chainId: 4201)
- LUKSO Mainnet (chainId: 42)

## Environment Variables

```bash
# Network RPC URLs
LUKSO_MAINNET_RPC=https://rpc.mainnet.lukso.network
LUKSO_TESTNET_RPC=https://rpc.testnet.lukso.network

# Deployment private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Optional: Etherscan API for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Screenshots

See the `screenshots/` directory for visual documentation of:
- Deployment process
- Permission configuration
- Transaction execution flow
- Controller list verification

## What This Demonstrates

1. **Multi-Agent Control**: How multiple OpenClaw sub-agents can share control of a single UP
2. **Role-Based Access**: Different agents have different capabilities
3. **Secure Delegation**: Permissions are enforced at the contract level
4. **Gas Abstraction**: Relay calls enable gasless transactions
5. **Flexible Management**: Controllers can be added/removed dynamically

## Use Cases

- **DAO Governance**: Different members with different voting/execution rights
- **Multi-Sig Wallets**: Require multiple approvals for transactions
- **Sub-Agent Systems**: OpenClaw sub-agents with specific roles
- **Automated Trading**: Bots with limited permissions for specific operations
- **Organization Management**: Department-specific permissions

## Development

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy to Testnet
```bash
npx hardhat run scripts/deploy.ts --network luksoTestnet
```

## Resources

- [LUKSO Documentation](https://docs.lukso.tech/)
- [LSP6 KeyManager Standard](https://docs.lukso.tech/standards/universal-profile/lsp6-key-manager)
- [LSP0 ERC725Account](https://docs.lukso.tech/standards/universal-profile/lsp0-erc725account)
- [ERC725 Standard](https://docs.lukso.tech/standards/lsp-background/erc725)

## License

MIT

## Author

Built for demonstrating LUKSO LSP6 capabilities and OpenClaw sub-agent integration patterns.
