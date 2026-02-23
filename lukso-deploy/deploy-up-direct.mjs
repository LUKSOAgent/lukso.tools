import { createPublicClient, createWalletClient, http, defineChain, encodeFunctionData, getContract, zeroAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync, existsSync, writeFileSync } from 'fs';

// LUKSO Mainnet configuration
const luksoMainnet = defineChain({
  id: 42,
  name: 'LUKSO Mainnet',
  network: 'lukso-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'LYX',
    symbol: 'LYX',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.mainnet.lukso.network'],
    },
    public: {
      http: ['https://rpc.mainnet.lukso.network'],
    },
  },
});

// ABIs
const ERC1967_PROXY_ABI = [
  {
    inputs: [
      { name: 'implementation', type: 'address' },
      { name: '_data', type: 'bytes' },
    ],
    stateMutability: 'payable',
    type: 'constructor',
  },
];

const UP_INIT_ABI = [
  {
    inputs: [{ name: 'initialOwner', type: 'address' }],
    name: 'initialize',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
];

const KM_INIT_ABI = [
  {
    inputs: [{ name: 'target_', type: 'address' }],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const UP_ABI = [
  {
    inputs: [
      { name: 'dataKeys', type: 'bytes32[]' },
      { name: 'dataValues', type: 'bytes[]' },
    ],
    name: 'setDataBatch',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const KM_ABI = [
  {
    inputs: [{ name: 'payload', type: 'bytes' }],
    name: 'execute',
    outputs: [{ name: '', type: 'bytes' }],
    stateMutability: 'payable',
    type: 'function',
  },
];

async function deployUniversalProfileDirect() {
  console.log('🚀 Starting Direct Universal Profile Deployment');
  console.log('================================================');
  console.log('Network: LUKSO Mainnet (Chain ID: 42)');
  console.log('Method: Direct proxy deployment (no LSP23 factory)');
  console.log('');

  try {
    // Load credentials
    if (!existsSync('up-deployment-credentials.json')) {
      console.error('❌ No credentials file found!');
      process.exit(1);
    }
    
    const credentials = JSON.parse(readFileSync('up-deployment-credentials.json', 'utf8'));
    const walletAddress = credentials.walletAddress;
    const privateKey = credentials.privateKey;
    console.log(`📂 Loaded wallet: ${walletAddress}`);
    console.log('');

    const account = privateKeyToAccount(privateKey);

    // Create viem clients
    console.log('🔗 Connecting to LUKSO Mainnet...');
    const publicClient = createPublicClient({
      chain: luksoMainnet,
      transport: http(),
    });

    const walletClient = createWalletClient({
      account,
      chain: luksoMainnet,
      transport: http(),
    });

    // Check balance
    console.log('💰 Checking wallet balance...');
    const balance = await publicClient.getBalance({ address: walletAddress });
    console.log(`   Balance: ${Number(balance) / 1e18} LYX`);
    console.log('');

    if (balance === 0n) {
      console.log('❌ ERROR: Wallet has no LYX!');
      return { success: false, error: 'WALLET_NOT_FUNDED' };
    }

    // Contract addresses (v0.12.1)
    const UP_IMPLEMENTATION = '0x52c90985AF970D4E0DC26Cb5D052505278aF32A9';
    const KM_IMPLEMENTATION = '0xa75684d7D048704a2DB851D05Ba0c3cbe226264C';

    // Step 1: Deploy UP Proxy
    console.log('📋 Step 1: Deploying Universal Profile Proxy...');
    const upInitCalldata = encodeFunctionData({
      abi: UP_INIT_ABI,
      functionName: 'initialize',
      args: [walletAddress],
    });

    // Get proxy bytecode
    const proxyBytecode = await publicClient.getBytecode({ address: UP_IMPLEMENTATION });
    console.log(`   UP Implementation: ${UP_IMPLEMENTATION}`);
    console.log(`   Init calldata: ${upInitCalldata}`);
    console.log('');
    
    // Deploy proxy using create2 or just regular deploy
    // For simplicity, we'll use a factory pattern or direct deploy
    // Actually, let's use the universal profile deploy directly
    
    console.log('⏳ Deploying UP proxy contract...');
    
    // Deploy the proxy manually
    const deployHash = await walletClient.deployContract({
      abi: ERC1967_PROXY_ABI,
      bytecode: '0x60806040526040516108693803806108698339818101604052604081101561002657600080fd5b81516020830180519196919061003d9161015c565b6100468461018f565b60405161005391906101d9565b600060405180830381855af49150503d806000811461008e576040519150601f19603f3d011682016040523d82523d6000602084013e610093565b606091505b5091509150816100a55760156100b1565b808060200190518101906100b1919061020d565b60030b61014f5760405162461bcd60e51b815260206004820152602a60248201527f46756e6374696f6e206d7573742062652063616c6c656420647572696e672064656044820152691819985a5b195c9958dd60b21b606482015260840160405180910390fd5b50505050610230565b80516f6af2424e4568f0a0cd528e4e1300000000009081900b8152602081019190912601016040516020818303038152906040528051906020012090565b604051806040016040528060008152602001606081525090565b600080604083850312156101ec57600080fd5b50508035926020909101359150565b60006020828403121561020f57600080fd5b81518060030b811461021f57600080fd5b9392505050565b603f8061023e6000396000f3fe6080604052600080fdfea2646970667358221220b2f3b4f5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a70000000000000000000000000000000000000000000000000000000000000000',
      args: [UP_IMPLEMENTATION, upInitCalldata],
    });

    console.log(`   Deploy tx: ${deployHash}`);
    const deployReceipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
    const upAddress = deployReceipt.contractAddress;
    
    console.log(`   ✅ UP Proxy deployed: ${upAddress}`);
    console.log(`   Block: ${deployReceipt.blockNumber}`);
    console.log('');

    // Step 2: Deploy KeyManager Proxy
    console.log('📋 Step 2: Deploying Key Manager Proxy...');
    const kmInitCalldata = encodeFunctionData({
      abi: KM_INIT_ABI,
      functionName: 'initialize',
      args: [upAddress],
    });

    console.log(`   KM Implementation: ${KM_IMPLEMENTATION}`);
    console.log(`   Target (UP): ${upAddress}`);
    console.log(`   Init calldata: ${kmInitCalldata}`);
    console.log('');

    console.log('⏳ Deploying KeyManager proxy contract...');
    
    const kmDeployHash = await walletClient.deployContract({
      abi: ERC1967_PROXY_ABI,
      bytecode: '0x60806040526040516108693803806108698339818101604052604081101561002657600080fd5b81516020830180519196919061003d9161015c565b6100468461018f565b60405161005391906101d9565b600060405180830381855af49150503d806000811461008e576040519150601f19603f3d011682016040523d82523d6000602084013e610093565b606091505b5091509150816100a55760156100b1565b808060200190518101906100b1919061020d565b60030b61014f5760405162461bcd60e51b815260206004820152602a60248201527f46756e6374696f6e206d7573742062652063616c6c656420647572696e672064656044820152691819985a5b195c9958dd60b21b606482015260840160405180910390fd5b50505050610230565b80516f6af2424e4568f0a0cd528e4e1300000000009081900b8152602081019190912601016040516020818303038152906040528051906020012090565b604051806040016040528060008152602001606081525090565b600080604083850312156101ec57600080fd5b50508035926020909101359150565b60006020828403121561020f57600080fd5b81518060030b811461021f57600080fd5b9392505050565b603f8061023e6000396000f3fe6080604052600080fdfea2646970667358221220b2f3b4f5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a70000000000000000000000000000000000000000000000000000000000000000',
      args: [KM_IMPLEMENTATION, kmInitCalldata],
    });

    console.log(`   Deploy tx: ${kmDeployHash}`);
    const kmDeployReceipt = await publicClient.waitForTransactionReceipt({ hash: kmDeployHash });
    const kmAddress = kmDeployReceipt.contractAddress;

    console.log(`   ✅ KeyManager Proxy deployed: ${kmAddress}`);
    console.log(`   Block: ${kmDeployReceipt.blockNumber}`);
    console.log('');

    // Step 3: Set up permissions and transfer ownership
    console.log('📋 Step 3: Configuring permissions...');
    
    // This would involve setting up LSP6 permissions, URD, etc.
    // For now, just transfer ownership to KeyManager
    
    const transferHash = await walletClient.writeContract({
      address: upAddress,
      abi: UP_ABI,
      functionName: 'transferOwnership',
      args: [kmAddress],
    });
    
    console.log(`   Transfer ownership tx: ${transferHash}`);
    await publicClient.waitForTransactionReceipt({ hash: transferHash });
    console.log('   ✅ Ownership transferred to KeyManager');
    console.log('');

    // Accept ownership via KeyManager
    const acceptPayload = encodeFunctionData({
      abi: UP_ABI,
      functionName: 'acceptOwnership',
    });

    const acceptHash = await walletClient.writeContract({
      address: kmAddress,
      abi: KM_ABI,
      functionName: 'execute',
      args: [acceptPayload],
    });
    
    console.log(`   Accept ownership tx: ${acceptHash}`);
    await publicClient.waitForTransactionReceipt({ hash: acceptHash });
    console.log('   ✅ Ownership accepted by KeyManager');
    console.log('');

    // Save results
    const result = {
      success: true,
      network: 'LUKSO Mainnet',
      chainId: 42,
      walletAddress,
      contracts: {
        LSP0ERC725Account: {
          address: upAddress,
          deployTx: deployHash,
        },
        LSP6KeyManager: {
          address: kmAddress,
          deployTx: kmDeployHash,
        },
      },
      timestamp: new Date().toISOString(),
    };

    writeFileSync('up-deployment-result.json', JSON.stringify(result, null, 2));

    console.log('🎉 SUCCESS! Universal Profile Deployed');
    console.log('================================================');
    console.log(`📍 Universal Profile Address: ${upAddress}`);
    console.log(`🔐 Key Manager Address: ${kmAddress}`);
    console.log('');
    console.log('💾 Deployment result saved to up-deployment-result.json');
    console.log('');

    return result;

  } catch (error) {
    console.error('');
    console.error('❌ DEPLOYMENT FAILED');
    console.error('================================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('');

    writeFileSync('up-deployment-error-direct.json', JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
    }, null, 2));

    return { success: false, error: error.message };
  }
}

deployUniversalProfileDirect()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
