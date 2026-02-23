# LSP23 Universal Profile Deployment

Deploy Universal Profiles on LUKSO Testnet and Mainnet using the LSP23LinkedContractsFactory for atomic UP + KeyManager deployment.

## Quick Start

```bash
# Install dependencies
npm install viem @lukso/lsp-factory.js

# Run deployment
node deploy-up.js
```

## Prerequisites

- Node.js 18+
- LYX (Mainnet) or LYXt (Testnet) for gas fees
- LUKSO-compatible wallet private key

## Network Configuration

### Testnet (Chain ID: 4201)

```javascript
const luksoTestnet = {
  id: 4201,
  name: 'LUKSO Testnet',
  rpcUrls: {
    default: { http: ['https://rpc.testnet.lukso.network'] },
  },
  nativeCurrency: {
    decimals: 18,
    name: 'LYXt',
    symbol: 'LYXt',
  },
};
```

**Faucet:** https://faucet.testnet.lukso.network

### Mainnet (Chain ID: 42)

```javascript
const luksoMainnet = {
  id: 42,
  name: 'LUKSO Mainnet',
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.lukso.network'] },
  },
  nativeCurrency: {
    decimals: 18,
    name: 'LYX',
    symbol: 'LYX',
  },
};
```

## Deployment Script

### Basic Testnet Deployment

```javascript
const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { LSPFactory } = require('@lukso/lsp-factory.js');

// Your wallet private key (with testnet LYXt)
const PRIVATE_KEY = '0x...';
const account = privateKeyToAccount(PRIVATE_KEY);

// Create clients
const publicClient = createPublicClient({
  chain: luksoTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: luksoTestnet,
  transport: http(),
});

// Deploy
const lspFactory = new LSPFactory(publicClient, walletClient);

const result = await lspFactory.UniversalProfile.deploy(
  {
    controllerAddresses: [account.address],
  },
  {
    version: '0.14.0',
    onDeployEvents: {
      next: (event) => console.log(`${event.contractName}: ${event.status}`),
      error: (err) => console.error('Error:', err),
      complete: (contracts) => console.log('Done!', contracts),
    },
  }
);

console.log('UP Address:', result.LSP0ERC725Account.address);
console.log('KM Address:', result.LSP6KeyManager.address);
```

### Mainnet Deployment

Same code, just use `luksoMainnet` instead of `luksoTestnet`.

## Configuration Options

### Contract Versions

| Version | Description |
|---------|-------------|
| `0.14.0` | Latest stable (recommended) |
| `0.12.1` | Previous stable |
| `0.12.0` | Legacy support |

### Controller Options

```javascript
// Single controller with all permissions
controllerAddresses: ['0x...']

// Multiple controllers
controllerAddresses: ['0x...', '0x...']

// Custom permissions per controller
controllerAddresses: [
  { address: '0x...', permissions: '0x...' },
  { address: '0x...', permissions: '0x...' },
]
```

### Custom Salt (Deterministic Addresses)

```javascript
const result = await lspFactory.UniversalProfile.deploy(
  { controllerAddresses: [account.address] },
  {
    version: '0.14.0',
    salt: '0x1234...', // bytes32 salt for CREATE2
  }
);
```

## Pre-compute Addresses

Calculate the UP and KeyManager addresses before deployment:

```javascript
const { upAddress, keyManagerAddress } = await lspFactory.UniversalProfile.computeAddress(
  { controllerAddresses: [account.address] },
  { version: '0.14.0', salt: '0x...' }
);

console.log('Predicted UP:', upAddress);
console.log('Predicted KM:', keyManagerAddress);
```

## Contract Addresses

### LSP23 Factory

| Network | Address |
|---------|---------|
| Testnet | `0x2300000A84D25dF63081feAa37ba6b62C4c89a30` |
| Mainnet | `0x2300000A84D25dF63081feAa37ba6b62C4c89a30` |

### Base Contracts (v0.14.0)

| Contract | Testnet | Mainnet |
|----------|---------|---------|
| ERC725Account | `0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F` | `0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F` |
| KeyManager | `0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4` | `0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4` |
| UniversalReceiverDelegate | `0x7870C5B8BC9572A8001C3f96f7ff59961B23500D` | `0x7870C5B8BC9572A8001C3f96f7ff59961B23500D` |

## Gas Estimates

| Operation | Gas Used |
|-----------|----------|
| LSP23 Deployment (UP + KM) | ~225,000 |
| setDataAndTransferOwnership | ~400,000-600,000 |
| **Total** | **~625,000-825,000** |

At 10 gwei gas price: ~0.006-0.008 LYX

## Troubleshooting

### "Wallet has no LYX/LYXt"

Fund your wallet:
- **Testnet:** https://faucet.testnet.lukso.network (requires Twitter)
- **Mainnet:** Buy LYX on exchange or bridge

### "SecondaryContractProxyInitFailureError"

This happens when the UP's `initialize()` function receives the wrong owner address. The `upInitOwner` parameter must be the deployer's address, NOT the predicted UP address.

**Correct:**
```javascript
upInitOwner: signerAddress // deployer's address
```

**Incorrect:**
```javascript
upInitOwner: predictedUpAddress // causes circular reference
```

### Transaction Timeout

The `setDataAndTransferOwnership` step may timeout. The LSP23 deployment (step 1) usually succeeds. If this happens:

1. Check the deployed UP address in the transaction receipt
2. Manually complete setup using the UP's `setDataBatch` and ownership transfer functions

### "No contract configuration found for chain X"

Ensure your chain ID matches:
- Testnet: `4201`
- Mainnet: `42`

## Example: Complete Deployment with Error Handling

```javascript
async function deployUP(privateKey, network = 'testnet') {
  const chain = network === 'mainnet' ? luksoMainnet : luksoTestnet;
  const account = privateKeyToAccount(privateKey);
  
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });
  
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  });
  
  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  if (balance < 1000000000000000n) {
    throw new Error(`Insufficient balance: ${balance} wei`);
  }
  
  // Deploy
  const lspFactory = new LSPFactory(publicClient, walletClient);
  
  try {
    const result = await lspFactory.UniversalProfile.deploy(
      { controllerAddresses: [account.address] },
      {
        version: '0.14.0',
        onDeployEvents: {
          next: (e) => console.log(`${e.contractName}: ${e.status}`),
          error: (e) => console.error('Deploy error:', e),
          complete: (c) => console.log('Complete:', c),
        },
      }
    );
    
    return {
      success: true,
      upAddress: result.LSP0ERC725Account.address,
      kmAddress: result.LSP6KeyManager.address,
      txHash: result.LSP0ERC725Account.receipt.transactionHash,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Usage
const result = await deployUP('0x...', 'mainnet');
console.log(result);
```

## Links

- **Testnet Explorer:** https://explorer.execution.testnet.lukso.network
- **Mainnet Explorer:** https://explorer.execution.mainnet.lukso.network
- **LUKSO Docs:** https://docs.lukso.tech
- **GitHub PR #264:** https://github.com/lukso-network/tools-lsp-factory/pull/264

## License

MIT — Part of @lukso/lsp-factory.js
