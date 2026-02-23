import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, createWalletClient, http } from 'viem';
import { luksoTestnet } from 'viem/chains';
import { LSPFactory } from '@lukso/lsp-factory.js';
import * as fs from 'fs';

// Use the funded controller wallet from credentials
const CONTROLLER_PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const account = privateKeyToAccount(CONTROLLER_PRIVATE_KEY);

console.log('🔑 Using funded controller wallet:', account.address);

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

// Check balance
const balance = await publicClient.getBalance({ address: account.address });
console.log('💰 Balance:', (Number(balance) / 1e18).toFixed(4), 'LYXt');

if (balance === 0n) {
  console.error('❌ Wallet has no LYXt. Please fund it first.');
  process.exit(1);
}

// Create LSPFactory instance
console.log('🏭 Creating LSPFactory (v4 with viem + LSP23)...');
const factory = new LSPFactory(publicClient, walletClient);

// Generate a deterministic salt
const salt = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
console.log('🧂 Salt for deterministic deployment:', salt);

// Compute address before deployment (shows deterministic deployment feature)
console.log('📝 Computing deterministic addresses...');
const { upAddress, keyManagerAddress } = await factory.UniversalProfile.computeAddress(
  { controllerAddresses: [account.address] },
  { salt }
);
console.log('   Expected UP Address:', upAddress);
console.log('   Expected KeyManager Address:', keyManagerAddress);

// Deploy Universal Profile
console.log('🚀 Deploying Universal Profile via LSP23LinkedContractsFactory...');
const startTime = Date.now();

try {
  const contracts = await factory.UniversalProfile.deploy(
    {
      controllerAddresses: [account.address],
    },
    {
      salt,
      onDeployEvents: {
        next: (event) => {
          console.log(`   [${event.status}] ${event.contractName} - ${event.functionName}`);
        },
        error: (error) => {
          console.error('   ❌ Error:', error.message || error);
        },
        complete: (deployedContracts) => {
          console.log('   ✅ Deployment complete callback triggered');
        },
      },
    }
  );

  const duration = Date.now() - startTime;
  console.log('');
  console.log('🎉 Deployment successful!');
  console.log('   Duration:', duration, 'ms');
  console.log('');
  console.log('📋 Contract Addresses:');
  console.log('   LSP0 ERC725 Account (UP):', contracts.LSP0ERC725Account.address);
  console.log('   LSP6 KeyManager:', contracts.LSP6KeyManager.address);
  console.log('');
  console.log('🔗 Transaction Hash:', contracts.LSP0ERC725Account.receipt?.transactionHash);
  console.log('🔗 Block Number:', contracts.LSP0ERC725Account.receipt?.blockNumber?.toString());
  console.log('');
  console.log('🌐 View on UniversalEverything:');
  console.log(`   https://universaleverything.io/${contracts.LSP0ERC725Account.address}`);
  console.log('');
  console.log('🔍 View on LUKSO Testnet Explorer:');
  console.log(`   https://explorer.testnet.lukso.network/address/${contracts.LSP0ERC725Account.address}`);
  
  // Save deployment info
  const deploymentInfo = {
    upAddress: contracts.LSP0ERC725Account.address,
    keyManagerAddress: contracts.LSP6KeyManager.address,
    txHash: contracts.LSP0ERC725Account.receipt?.transactionHash,
    blockNumber: contracts.LSP0ERC725Account.receipt?.blockNumber?.toString(),
    gasUsed: contracts.LSP0ERC725Account.receipt?.gasUsed?.toString(),
    salt,
    controllerAddress: account.address,
    timestamp: new Date().toISOString(),
    factoryVersion: '4.0.0 (LSP23 refactor)',
    network: 'LUKSO Testnet',
  };
  
  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log('');
  console.log('💾 Deployment info saved to deployment.json');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message || error);
  console.error(error.stack);
  process.exit(1);
}
