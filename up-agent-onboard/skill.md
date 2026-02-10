# LUKSO Universal Profile Skill for OpenClaw Agents

## Overview

This skill enables your OpenClaw agent to interact with LUKSO blockchain, manage Universal Profiles (UPs), and execute transactions through the Key Manager pattern.

## Prerequisites

- Node.js environment
- LYX tokens for gas (0.1-0.5 LYX for deployment)
- Controller wallet with private key

## Installation

```bash
npm install ethers @lukso/lsp-factory.js
```

## Configuration

Store credentials in your workspace `.credentials` file:

```yaml
## LUKSO Universal Profile
Universal Profile Address: 0xYOUR_UP_ADDRESS
Key Manager Address: 0xYOUR_KEYMANAGER_ADDRESS
Controller Address: 0xYOUR_CONTROLLER_ADDRESS
Private Key: 0xYOUR_PRIVATE_KEY
Chain ID: 42
RPC URL: https://rpc.mainnet.lukso.network
```

## Core Concepts

### 1. Universal Profile (LSP0)
Your on-chain smart contract identity that holds assets and data.

### 2. Key Manager (LSP6)
Permission layer controlling what controllers can do with your UP.

### 3. Controller
EOA wallet that signs transactions to execute through the Key Manager.

## Transaction Pattern

All transactions must flow: **Controller → KeyManager → UP → Target**

```javascript
const { ethers } = require('ethers');

// Setup
const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Key Manager contract
const keyManager = new ethers.Contract(KEY_MANAGER_ADDRESS, LSP6_ABI, wallet);

// 1. Encode target action
const target = new ethers.Contract(TARGET_ADDRESS, TARGET_ABI);
const actionData = target.interface.encodeFunctionData('transfer', [to, amount]);

// 2. Encode UP.execute()
const up = new ethers.Interface(LSP0_ABI);
const upData = up.encodeFunctionData('execute', [0, TARGET_ADDRESS, 0, actionData]);

// 3. Execute via KeyManager
const tx = await keyManager.execute(upData);
await tx.wait();
```

## Common Operations

### Deploy New Universal Profile

```javascript
const { LSPFactory } = require('@lukso/lsp-factory.js');

const lspFactory = new LSPFactory('https://rpc.mainnet.lukso.network', {
  deployKey: PRIVATE_KEY,
  chainId: 42,
});

const deployed = await lspFactory.LSP3UniversalProfile.deploy({
  controllingAccounts: [CONTROLLER_ADDRESS],
  lsp3Profile: {
    name: 'MyAgent',
    description: 'AI agent on LUKSO',
    tags: ['ai', 'agent'],
  },
});

console.log('UP:', deployed.LSP0UniversalProfile.address);
console.log('KeyManager:', deployed.LSP6KeyManager.address);
```

### Send LYX

```javascript
// Encode simple LYX transfer
const upInterface = new ethers.Interface(LSP0_ABI);
const data = upInterface.encodeFunctionData('execute', [
  0, // CALL
  recipient,
  ethers.parseEther('0.1'), // amount
  '0x' // empty data
]);

const tx = await keyManager.execute(data);
await tx.wait();
```

### Interact with LSP7 Token

```javascript
const LSP7_ABI = [
  "function mint(address to, uint256 amount, bool force, bytes data) external",
  "function transfer(address from, address to, uint256 amount, bool force, bytes data) external"
];

const token = new ethers.Interface(LSP7_ABI);
const tokenData = token.encodeFunctionData('transfer', [
  UP_ADDRESS, // from
  recipient,
  amount,
  false, // force (false = check receiver)
  '0x'
]);

const upData = upInterface.encodeFunctionData('execute', [
  0,
  TOKEN_ADDRESS,
  0,
  tokenData
]);

await keyManager.execute(upData);
```

### Follow via LSP26

```javascript
const LSP26_ABI = [
  "function follow(address[] calldata addresses) external"
];

const lsp26 = new ethers.Interface(LSP26_ABI);
const followData = lsp26.encodeFunctionData('follow', [[targetAddress]]);

const upData = upInterface.encodeFunctionData('execute', [
  0,
  '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA', // LSP26 Follower System
  0,
  followData
]);

await keyManager.execute(upData);
```

## LSP26 Follower System

Mainnet address: `0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA`

Functions:
- `follow(address[])` - Follow multiple addresses
- `unfollow(address[])` - Unfollow addresses
- `isFollowing(address, address)` - Check follow status

**Note:** If any address in batch is already followed, entire tx reverts. Check first or use one-by-one.

## Network Details

- **Network:** LUKSO Mainnet
- **Chain ID:** 42
- **RPC:** https://rpc.mainnet.lukso.network
- **Explorer:** https://explorer.lukso.network
- **Currency:** LYX

## Factory Addresses

- **LSP23 Linked Contracts Factory:** `0x2300000A84D25dF63081feAa37ba6b62C4c89a30`

## Resources

- **Docs:** https://docs.lukso.tech
- **Contracts:** https://github.com/lukso-network/lsp-smart-contracts
- **LSPs:** https://github.com/lukso-network/LIPs/tree/main/LSPs

## Example: Complete Agent Setup

```javascript
// save-as: setup-lukso-agent.js
const { ethers } = require('ethers');
const { LSPFactory } = require('@lukso/lsp-factory.js');

async function setupAgent() {
  // Generate or load controller
  const wallet = ethers.Wallet.createRandom();
  console.log('🆕 Controller:', wallet.address);
  console.log('🔑 Private Key:', wallet.privateKey);
  
  // Initialize factory
  const lspFactory = new LSPFactory('https://rpc.mainnet.lukso.network', {
    deployKey: wallet.privateKey,
    chainId: 42,
  });
  
  // Deploy UP
  console.log('📤 Deploying Universal Profile...');
  const deployed = await lspFactory.LSP3UniversalProfile.deploy({
    controllingAccounts: [wallet.address],
    lsp3Profile: {
      name: 'MyOpenClawAgent',
      description: 'Autonomous agent on LUKSO',
      tags: ['openclaw', 'ai', 'agent'],
    },
  });
  
  const config = {
    upAddress: deployed.LSP0UniversalProfile.address,
    keyManagerAddress: deployed.LSP6KeyManager.address,
    controllerAddress: wallet.address,
    privateKey: wallet.privateKey,
    rpcUrl: 'https://rpc.mainnet.lukso.network',
    chainId: 42,
  };
  
  console.log('✅ Agent deployed!');
  console.log('UP:', config.upAddress);
  console.log('KeyManager:', config.keyManagerAddress);
  
  // Save to file
  require('fs').writeFileSync(
    'lukso-credentials.json',
    JSON.stringify(config, null, 2)
  );
  
  return config;
}

setupAgent().catch(console.error);
```

## Security Notes

- Never commit private keys to git
- Use environment variables for sensitive data
- Controller keys have full control over the UP
- Consider using social recovery (LSP11) for production

---

Built for OpenClaw agents by @LUKSOAgent
