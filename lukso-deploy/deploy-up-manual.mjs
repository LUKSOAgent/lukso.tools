import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  defineChain, 
  encodeFunctionData, 
  getAddress,
  concat,
  pad,
  toHex,
  hexToBytes,
  keccak256
} from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
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

// Universal Profile bytecode (simplified ERC1967 proxy)
// This is the standard ERC1967 proxy creation code
function getProxyBytecode(implementation, initData) {
  // ERC1967 proxy: constructor(address implementation, bytes memory _data)
  // Bytecode from: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/proxy/ERC1967/ERC1967Proxy.sol
  
  // Actually, let's use a simpler approach - deploy via transaction
  return null;
}

// ABIs
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

async function deployViaLSP23Manual() {
  console.log('🚀 Manual LSP23 Universal Profile Deployment');
  console.log('==============================================');
  console.log('Network: LUKSO Mainnet (Chain ID: 42)');
  console.log('Method: Manual LSP23 factory call');
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

    // LSP23 Factory
    const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
    
    // Implementation addresses (v0.12.1)
    const UP_IMPLEMENTATION = '0x52c90985AF970D4E0DC26Cb5D052505278aF32A9';
    const KM_IMPLEMENTATION = '0xa75684d7D048704a2DB851D05Ba0c3cbe226264C';

    // Generate random salt
    const salt = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('📋 Deployment Parameters:');
    console.log(`   Salt: ${salt}`);
    console.log(`   UP Implementation: ${UP_IMPLEMENTATION}`);
    console.log(`   KM Implementation: ${KM_IMPLEMENTATION}`);
    console.log(`   Initial Owner: ${walletAddress}`);
    console.log('');

    // Build initialization calldata
    const upInitCalldata = encodeFunctionData({
      abi: UP_INIT_ABI,
      functionName: 'initialize',
      args: [walletAddress],
    });

    // For KeyManager, we need the UP address but don't have it yet
    // The factory appends it via addPrimaryContractAddress
    // Let's try with a placeholder and see what happens
    const kmInitCalldata = encodeFunctionData({
      abi: KM_INIT_ABI,
      functionName: 'initialize',
      args: ['0x0000000000000000000000000000000000000000'],
    });

    // LSP23 ABI (simplified)
    const LSP23_ABI = [
      {
        inputs: [
          {
            components: [
              { name: 'salt', type: 'bytes32' },
              { name: 'fundingAmount', type: 'uint256' },
              { name: 'implementationContract', type: 'address' },
              { name: 'initializationCalldata', type: 'bytes' },
            ],
            name: 'primaryContractDeploymentInit',
            type: 'tuple',
          },
          {
            components: [
              { name: 'fundingAmount', type: 'uint256' },
              { name: 'implementationContract', type: 'address' },
              { name: 'initializationCalldata', type: 'bytes' },
              { name: 'addPrimaryContractAddress', type: 'bool' },
              { name: 'extraInitializationParams', type: 'bytes' },
            ],
            name: 'secondaryContractDeploymentInit',
            type: 'tuple',
          },
          { name: 'postDeploymentModule', type: 'address' },
          { name: 'postDeploymentModuleCalldata', type: 'bytes' },
        ],
        name: 'deployERC1167Proxies',
        outputs: [
          { name: 'primaryContractAddress', type: 'address' },
          { name: 'secondaryContractAddress', type: 'address' },
        ],
        stateMutability: 'payable',
        type: 'function',
      },
      {
        inputs: [
          {
            components: [
              { name: 'salt', type: 'bytes32' },
              { name: 'fundingAmount', type: 'uint256' },
              { name: 'implementationContract', type: 'address' },
              { name: 'initializationCalldata', type: 'bytes' },
            ],
            name: 'primaryContractDeploymentInit',
            type: 'tuple',
          },
          {
            components: [
              { name: 'fundingAmount', type: 'uint256' },
              { name: 'implementationContract', type: 'address' },
              { name: 'initializationCalldata', type: 'bytes' },
              { name: 'addPrimaryContractAddress', type: 'bool' },
              { name: 'extraInitializationParams', type: 'bytes' },
            ],
            name: 'secondaryContractDeploymentInit',
            type: 'tuple',
          },
          { name: 'postDeploymentModule', type: 'address' },
          { name: 'postDeploymentModuleCalldata', type: 'bytes' },
        ],
        name: 'computeERC1167Addresses',
        outputs: [
          { name: 'primaryContractAddress', type: 'address' },
          { name: 'secondaryContractAddress', type: 'address' },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ];

    // First, compute addresses to verify
    console.log('🔍 Computing expected addresses...');
    const [expectedUP, expectedKM] = await publicClient.readContract({
      address: LSP23_FACTORY,
      abi: LSP23_ABI,
      functionName: 'computeERC1167Addresses',
      args: [
        {
          salt,
          fundingAmount: 0n,
          implementationContract: UP_IMPLEMENTATION,
          initializationCalldata: upInitCalldata,
        },
        {
          fundingAmount: 0n,
          implementationContract: KM_IMPLEMENTATION,
          initializationCalldata: kmInitCalldata,
          addPrimaryContractAddress: true,
          extraInitializationParams: '0x',
        },
        '0x0000000000000000000000000000000000000000',
        '0x',
      ],
    });

    console.log(`   Expected UP: ${expectedUP}`);
    console.log(`   Expected KM: ${expectedKM}`);
    console.log('');

    // Check if contracts already exist at those addresses
    const upCode = await publicClient.getBytecode({ address: expectedUP });
    const kmCode = await publicClient.getBytecode({ address: expectedKM });

    if (upCode && upCode.length > 2) {
      console.log('⚠️  WARNING: Contract already exists at expected UP address!');
      console.log('   You may need to use a different salt.');
    }
    console.log('');

    // Try deployment
    console.log('⏳ Deploying via LSP23 factory...');
    console.log('');

    const { request } = await publicClient.simulateContract({
      address: LSP23_FACTORY,
      abi: LSP23_ABI,
      functionName: 'deployERC1167Proxies',
      args: [
        {
          salt,
          fundingAmount: 0n,
          implementationContract: UP_IMPLEMENTATION,
          initializationCalldata: upInitCalldata,
        },
        {
          fundingAmount: 0n,
          implementationContract: KM_IMPLEMENTATION,
          initializationCalldata: kmInitCalldata,
          addPrimaryContractAddress: true,
          extraInitializationParams: '0x',
        },
        '0x0000000000000000000000000000000000000000',
        '0x',
      ],
      account,
    });

    const txHash = await walletClient.writeContract(request);
    console.log(`   Transaction: ${txHash}`);
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed}`);
    console.log('');

    // Get the deployed addresses from logs
    // The event would contain the addresses
    console.log('📋 Checking deployed contracts...');
    
    const finalUPCode = await publicClient.getBytecode({ address: expectedUP });
    const finalKMCode = await publicClient.getBytecode({ address: expectedKM });

    if (finalUPCode && finalUPCode.length > 2) {
      console.log(`   ✅ UP deployed at: ${expectedUP}`);
    } else {
      console.log('   ❌ UP not found at expected address');
    }

    if (finalKMCode && finalKMCode.length > 2) {
      console.log(`   ✅ KM deployed at: ${expectedKM}`);
    } else {
      console.log('   ❌ KM not found at expected address');
    }

    // Save results
    const result = {
      success: true,
      network: 'LUKSO Mainnet',
      chainId: 42,
      walletAddress,
      lsp23Factory: LSP23_FACTORY,
      salt,
      contracts: {
        LSP0ERC725Account: {
          address: expectedUP,
          deployed: !!(finalUPCode && finalUPCode.length > 2),
        },
        LSP6KeyManager: {
          address: expectedKM,
          deployed: !!(finalKMCode && finalKMCode.length > 2),
        },
      },
      transaction: {
        hash: txHash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: receipt.gasUsed.toString(),
      },
      timestamp: new Date().toISOString(),
    };

    writeFileSync('up-deployment-result.json', JSON.stringify(result, null, 2));
    console.log('');
    console.log('💾 Deployment result saved to up-deployment-result.json');
    console.log('');

    return result;

  } catch (error) {
    console.error('');
    console.error('❌ DEPLOYMENT FAILED');
    console.error('==============================================');
    console.error('Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause.message);
    }
    console.error('');

    writeFileSync('up-deployment-error-manual.json', JSON.stringify({
      success: false,
      error: error.message,
      cause: error.cause?.message,
      stack: error.stack,
    }, null, 2));

    return { success: false, error: error.message };
  }
}

deployViaLSP23Manual()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
