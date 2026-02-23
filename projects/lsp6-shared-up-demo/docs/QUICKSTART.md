# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Basic understanding of Ethereum/Solidity

## Installation

1. **Navigate to the project directory:**
```bash
cd projects/lsp6-shared-up-demo
```

2. **Install dependencies:**
```bash
npm install
```

3. **Copy environment variables (optional for local testing):**
```bash
cp .env.example .env
```

## Running the Demo

### Local Testing (Recommended for First Run)

1. **Start a local Hardhat node:**
```bash
npx hardhat node
```

2. **In a new terminal, run the demo:**
```bash
npx hardhat run scripts/demo-simple.ts --network localhost
```

Or use the npm script:
```bash
npm run demo:local
```

### Using In-Memory Network (Fastest)

Run directly without starting a node:
```bash
npx hardhat run scripts/demo-simple.ts
```

Or use the npm script:
```bash
npm run demo
```

## Running Tests

Execute the test suite:
```bash
npx hardhat test
```

Or:
```bash
npm test
```

Expected output:
```
LSP6 Shared UP / Mini-DAO
  Permission System
    ✔ Should generate correct permission keys
    ✔ Should correctly identify permissions
    ✔ Should combine permissions correctly
  Controller Roles
    ✔ Should have correct EXECUTOR permissions
    ✔ Should have correct DATA_MANAGER permissions
    ✔ Should have correct SIGNER permissions
  Permission Key Format
    ✔ Should follow LSP6 KeyManager format

7 passing (72ms)
```

## Understanding the Output

The demo runs through several phases:

### Phase 1: Controller Creation
- Creates 3 EOA controllers (simulating OpenClaw sub-agents)
- Funds each with 1.0 ETH
- Assigns different roles:
  - Agent Alpha: Executor
  - Agent Beta: Data Manager
  - Agent Gamma: Signer

### Phase 2: Permission Configuration
- Generates LSP6 permission keys
- Sets granular permissions for each controller
- Verifies permissions are correctly stored

### Phase 3: Permission Enforcement
- Tests that controllers can only perform allowed actions
- Agent Beta (Data Manager) successfully sets data
- Agent Alpha (Executor) is denied when trying to set data

### Phase 4: Batch Transactions
- Demonstrates executing multiple operations atomically
- Shows batch transaction planning and execution

### Phase 5: Relay Call Pattern
- Shows how relayers can submit transactions
- Controller signs, relayer pays gas
- Signature verification and permission checking

### Phase 6: Controller Management
- Adds a new controller dynamically
- Lists all controllers with their roles

## Key Files

| File | Description |
|------|-------------|
| `scripts/demo-simple.ts` | Main demo script (mock implementation) |
| `scripts/demo.ts` | Full implementation (requires contract deployment) |
| `src/permissions.ts` | LSP6 permission constants and utilities |
| `src/implementation.ts` | Implementation patterns and examples |
| `test/permissions.test.ts` | Test suite for permission system |
| `hardhat.config.js` | Hardhat configuration |

## Customization

### Adding New Controllers

Edit `scripts/demo-simple.ts` and add to the controllers array:

```typescript
const controllers: ControllerInfo[] = [
    // ... existing controllers
    {
        name: "🤖 Agent Epsilon",
        wallet: controller4,
        address: controller4.address,
        permissions: PERMISSIONS.SIGNER,  // Or combine: PERMISSIONS.EXECUTOR | PERMISSIONS.SIGNER
        role: "Custom role description"
    }
];
```

### Creating Custom Permissions

Combine existing permissions:

```typescript
const CUSTOM_ROLE = combinePermissions([
    LSP6_PERMISSIONS.EXECUTE,
    LSP6_PERMISSIONS.SETDATA
]);
```

### Running on LUKSO Testnet

1. Get testnet LYX from the [LUKSO Faucet](https://faucet.testnet.lukso.network)

2. Set your private key in `.env`:
```bash
PRIVATE_KEY=your_private_key_without_0x
```

3. Run on testnet:
```bash
npx hardhat run scripts/demo.ts --network luksoTestnet
```

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### "Hardhat not found" errors
```bash
npm install --legacy-peer-deps
```

### TypeScript compilation errors
```bash
npx tsc --noEmit
```

## Next Steps

1. Read the [Architecture Document](ARCHITECTURE.md) for technical details
2. Review the [Permission System](src/permissions.ts) for constants
3. Explore [Implementation Patterns](src/implementation.ts) for integration
4. Check the [README](../README.md) for feature overview

## Support

For questions about:
- **LUKSO/LSP Standards**: Visit [docs.lukso.tech](https://docs.lukso.tech)
- **Hardhat**: Visit [hardhat.org](https://hardhat.org)
- **This Demo**: Check the code comments and documentation
