# Project Structure

```
lsp6-shared-up-demo/
├── README.md                      # Main project documentation
├── PROJECT_STRUCTURE.md           # This file
├── package.json                   # Dependencies and scripts
├── package-lock.json              # Locked dependency versions
├── tsconfig.json                  # TypeScript configuration
├── hardhat.config.js              # Hardhat configuration
├── .env.example                   # Environment variable template
├── .gitignore                     # Git ignore rules
│
├── scripts/                       # Demo scripts
│   ├── demo-simple.ts            # Simplified demo (recommended)
│   └── demo.ts                   # Full implementation
│
├── src/                          # Source code
│   ├── permissions.ts            # LSP6 permission constants
│   └── implementation.ts         # Implementation patterns
│
├── test/                         # Test suite
│   └── permissions.test.ts       # Permission system tests
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md           # Technical architecture
│   └── QUICKSTART.md             # Quick start guide
│
├── screenshots/                  # Demo screenshots and outputs
│   ├── demo-output.txt           # Terminal output capture
│   └── terminal-session.md       # Session documentation
│
└── contracts/                    # Solidity contracts (if needed)
```

## File Descriptions

### Root Files

| File | Purpose |
|------|---------|
| `README.md` | Main documentation with overview, features, and usage |
| `package.json` | NPM configuration with dependencies and scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `hardhat.config.js` | Hardhat network and compiler settings |
| `.env.example` | Template for environment variables |
| `.gitignore` | Files to exclude from version control |

### Scripts (`scripts/`)

| File | Purpose |
|------|---------|
| `demo-simple.ts` | Main demo script with mock implementation - runs without contracts |
| `demo.ts` | Full implementation for use with actual LSP6 contracts |

### Source Code (`src/`)

| File | Purpose |
|------|---------|
| `permissions.ts` | LSP6 permission constants, key generation, and utility functions |
| `implementation.ts` | Implementation patterns for deployment, controller management, and execution |

### Tests (`test/`)

| File | Purpose |
|------|---------|
| `permissions.test.ts` | Test suite validating permission system functionality |

### Documentation (`docs/`)

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | Technical architecture, transaction flows, and security considerations |
| `QUICKSTART.md` | Quick start guide with installation and usage instructions |

### Screenshots (`screenshots/`)

| File | Purpose |
|------|---------|
| `demo-output.txt` | Captured terminal output from demo execution |
| `terminal-session.md` | Documentation of the terminal session |

## Key Scripts

```bash
# Run the simplified demo (no contracts needed)
npm run demo

# Run demo on local Hardhat node
npm run demo:local

# Start local Hardhat node
npm run node

# Run test suite
npm test

# Compile contracts (if using full implementation)
npm run compile
```

## Dependencies

### Production
- `@lukso/lsp-smart-contracts` - LUKSO smart contract implementations
- `@lukso/lsp0-contracts` - Universal Profile contracts
- `@lukso/lsp6-contracts` - KeyManager contracts

### Development
- `hardhat` - Ethereum development environment
- `ethers` - Ethereum library
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `@nomicfoundation/hardhat-toolbox` - Hardhat plugin suite
