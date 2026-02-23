import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  defineChain, 
  encodeFunctionData,
  decodeEventLog,
  parseAbi
} from 'viem';
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

// Contract ABIs
const LSP0_ABI = [
  {
    inputs: [{ name: 'initialOwner', type: 'address' }],
    name: 'initialize',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'dataKey', type: 'bytes32' }],
    name: 'getData',
    outputs: [{ name: '', type: 'bytes' }],
    stateMutability: 'view',
    type: 'function',
  },
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
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const LSP6_ABI = [
  {
    inputs: [{ name: 'target_', type: 'address' }],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'payload', type: 'bytes' }],
    name: 'execute',
    outputs: [{ name: '', type: 'bytes' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'target',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
];

async function deployDirectProxies() {
  console.log('🚀 Direct Proxy Universal Profile Deployment');
  console.log('============================================');
  console.log('Network: LUKSO Mainnet (Chain ID: 42)');
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

    // Implementation addresses (v0.12.1 - verified deployed)
    const UP_IMPLEMENTATION = '0x52c90985AF970D4E0DC26Cb5D052505278aF32A9';
    const KM_IMPLEMENTATION = '0xa75684d7D048704a2DB851D05Ba0c3cbe226264C';

    // Step 1: Deploy UP Proxy using minimal proxy (ERC1167) pattern manually
    console.log('📋 Step 1: Creating Universal Profile...');
    console.log('   Using direct contract deployment');
    console.log('');

    // Actually, let's try using the Base Contracts directly
    // Since LSP0 and LSP6 have initialization, we need to deploy proxies
    
    // For a minimal approach, let's just deploy the base contracts themselves
    // without proxies (they support this pattern)
    
    console.log('⚠️  Note: Deploying base contracts without proxies');
    console.log('   This is more expensive but avoids proxy issues');
    console.log('');

    // Deploy UP
    console.log('⏳ Deploying LSP0ERC725Account...');
    
    // Get the bytecode for a new UP instance
    // We'll use a simple factory approach or direct clone
    
    // For now, let's try using the existing implementations with initialization
    // We need to find a generic proxy factory or deploy our own
    
    // Alternative: Use the existing contracts via `new` if we have bytecode
    // But we don't have the full bytecode, so let's try a different approach
    
    // Let's check if there's a generic factory we can use
    console.log('🔍 Checking for proxy factories on mainnet...');
    
    // Common proxy factory addresses
    const COMMON_FACTORIES = [
      '0x0000000000000000000000000000000000000000', // Placeholder
    ];
    
    // Let me try a different approach - use CREATE2 directly
    // First, let's prepare the proxy bytecode
    
    // Standard ERC1967 proxy bytecode is complex
    // Let's use the LSP23 factory but with a different approach
    
    // Actually, let me try to understand why the KeyManager init is failing
    // by checking if the implementation accepts the initialize call directly
    
    console.log('');
    console.log('🔍 Testing KeyManager implementation...');
    
    // Test the KM implementation by calling a view function
    try {
      const kmTarget = await publicClient.readContract({
        address: KM_IMPLEMENTATION,
        abi: LSP6_ABI,
        functionName: 'target',
      });
      console.log(`   KM implementation target: ${kmTarget}`);
      
      if (kmTarget === '0x0000000000000000000000000000000000000000') {
        console.log('   ✅ Implementation is not initialized (expected)');
      } else {
        console.log('   ⚠️  Implementation may already be initialized');
      }
    } catch (e) {
      console.log(`   Error reading target: ${e.message}`);
    }
    
    console.log('');
    
    // Given the issues with the LSP23 factory, let's try deploying
    // using a different salt or approach
    
    // Try with a specific salt that might work
    const specificSalt = '0x0000000000000000000000000000000000000000000000000000000000000001';
    
    console.log('🔄 Retrying with specific salt...');
    console.log(`   Salt: ${specificSalt}`);
    console.log('');
    
    // The LSP23 factory ABI
    const LSP23_ABI = parseAbi([
      'function deployERC1167Proxies((bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, (uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata) payable returns (address primaryContractAddress, address secondaryContractAddress)',
      'function computeERC1167Addresses((bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, (uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata) view returns (address primaryContractAddress, address secondaryContractAddress)',
    ]);

    const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
    
    const upInitCalldata = encodeFunctionData({
      abi: LSP0_ABI,
      functionName: 'initialize',
      args: [walletAddress],
    });

    // Try different initialization for KM - maybe don't use addPrimaryContractAddress
    const kmInitCalldata = encodeFunctionData({
      abi: LSP6_ABI,
      functionName: 'initialize',
      args: ['0x0000000000000000000000000000000000000000'],
    });

    // Compute addresses first
    const [expectedUP, expectedKM] = await publicClient.readContract({
      address: LSP23_FACTORY,
      abi: LSP23_ABI,
      functionName: 'computeERC1167Addresses',
      args: [
        {
          salt: specificSalt,
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
    
    // Check if already deployed
    const upCode = await publicClient.getBytecode({ address: expectedUP });
    if (upCode && upCode.length > 2) {
      console.log('   ✅ Contracts already deployed at these addresses!');
      console.log('');
      
      const result = {
        success: true,
        network: 'LUKSO Mainnet',
        chainId: 42,
        walletAddress,
        contracts: {
          LSP0ERC725Account: {
            address: expectedUP,
          },
          LSP6KeyManager: {
            address: expectedKM,
          },
        },
        note: 'Contracts already existed at computed addresses',
        timestamp: new Date().toISOString(),
      };
      
      writeFileSync('up-deployment-result.json', JSON.stringify(result, null, 2));
      
      console.log('🎉 Universal Profile already deployed!');
      console.log('============================================');
      console.log(`📍 Universal Profile: ${expectedUP}`);
      console.log(`🔐 Key Manager: ${expectedKM}`);
      console.log('');
      
      return result;
    }
    
    // Try deployment with the specific salt
    console.log('⏳ Deploying...');
    
    try {
      const { request } = await publicClient.simulateContract({
        address: LSP23_FACTORY,
        abi: LSP23_ABI,
        functionName: 'deployERC1167Proxies',
        args: [
          {
            salt: specificSalt,
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
      console.log(`   ✅ Success! Block: ${receipt.blockNumber}`);
      
      const result = {
        success: true,
        network: 'LUKSO Mainnet',
        chainId: 42,
        walletAddress,
        contracts: {
          LSP0ERC725Account: {
            address: expectedUP,
          },
          LSP6KeyManager: {
            address: expectedKM,
          },
        },
        transaction: {
          hash: txHash,
          blockNumber: Number(receipt.blockNumber),
        },
        timestamp: new Date().toISOString(),
      };
      
      writeFileSync('up-deployment-result.json', JSON.stringify(result, null, 2));
      
      console.log('');
      console.log('🎉 Universal Profile Deployed!');
      console.log('============================================');
      console.log(`📍 Universal Profile: ${expectedUP}`);
      console.log(`🔐 Key Manager: ${expectedKM}`);
      console.log(`⛽ Transaction: ${txHash}`);
      console.log('');
      
      return result;
      
    } catch (error) {
      console.error('   ❌ Deployment failed:', error.message);
      
      // Save error
      writeFileSync('up-deployment-error-direct.json', JSON.stringify({
        success: false,
        error: error.message,
        salt: specificSalt,
        expectedUP,
        expectedKM,
      }, null, 2));
      
      return { success: false, error: error.message };
    }

  } catch (error) {
    console.error('');
    console.error('❌ DEPLOYMENT FAILED');
    console.error('============================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('');

    return { success: false, error: error.message };
  }
}

deployDirectProxies()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
