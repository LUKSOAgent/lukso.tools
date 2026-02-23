import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  defineChain, 
  encodeFunctionData,
  parseAbi,
  getAddress
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

async function deploySeparately() {
  console.log('🚀 Separate Universal Profile & KeyManager Deployment');
  console.log('======================================================');
  console.log('Network: LUKSO Mainnet (Chain ID: 42)');
  console.log('Strategy: Deploy UP first via factory, then KM manually');
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

    const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
    const UP_IMPLEMENTATION = '0x52c90985AF970D4E0DC26Cb5D052505278aF32A9'; // v0.12.1
    const KM_IMPLEMENTATION = '0xa75684d7D048704a2DB851D05Ba0c3cbe226264C'; // v0.12.1

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

    const LSP23_SINGLE_ABI = parseAbi([
      'function deployERC1167Proxy(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) payable returns (address proxyAddress)',
      'function computeERC1167Address(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) view returns (address proxyAddress)',
    ]);

    // Generate salt
    const salt = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('📋 Deployment Parameters:');
    console.log(`   Salt: ${salt}`);
    console.log(`   UP Implementation: ${UP_IMPLEMENTATION}`);
    console.log(`   Initial Owner: ${walletAddress}`);
    console.log('');

    // Prepare UP initialization
    const upInitCalldata = encodeFunctionData({
      abi: UP_INIT_ABI,
      functionName: 'initialize',
      args: [walletAddress],
    });

    // Check if factory supports single deployment
    console.log('🔍 Trying single proxy deployment...');
    
    try {
      // Try to compute address
      const expectedUP = await publicClient.readContract({
        address: LSP23_FACTORY,
        abi: LSP23_SINGLE_ABI,
        functionName: 'computeERC1167Address',
        args: [salt, 0n, UP_IMPLEMENTATION, upInitCalldata],
      });

      console.log(`   Expected UP: ${expectedUP}`);
      console.log('');

      // Deploy UP only
      console.log('⏳ Deploying Universal Profile...');
      
      const { request } = await publicClient.simulateContract({
        address: LSP23_FACTORY,
        abi: LSP23_SINGLE_ABI,
        functionName: 'deployERC1167Proxy',
        args: [salt, 0n, UP_IMPLEMENTATION, upInitCalldata],
        account,
      });

      const upTxHash = await walletClient.writeContract(request);
      console.log(`   Transaction: ${upTxHash}`);
      
      const upReceipt = await publicClient.waitForTransactionReceipt({ hash: upTxHash });
      console.log(`   ✅ UP deployed at: ${expectedUP}`);
      console.log(`   Block: ${upReceipt.blockNumber}`);
      console.log('');

      // Now deploy KeyManager pointing to the UP
      console.log('📋 Deploying Key Manager...');
      
      const KM_INIT_ABI = [
        {
          inputs: [{ name: 'target_', type: 'address' }],
          name: 'initialize',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ];

      const kmSalt = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      const kmInitCalldata = encodeFunctionData({
        abi: KM_INIT_ABI,
        functionName: 'initialize',
        args: [expectedUP],
      });

      const expectedKM = await publicClient.readContract({
        address: LSP23_FACTORY,
        abi: LSP23_SINGLE_ABI,
        functionName: 'computeERC1167Address',
        args: [kmSalt, 0n, KM_IMPLEMENTATION, kmInitCalldata],
      });

      console.log(`   Expected KM: ${expectedKM}`);
      console.log('');
      console.log('⏳ Deploying Key Manager...');

      const { request: kmRequest } = await publicClient.simulateContract({
        address: LSP23_FACTORY,
        abi: LSP23_SINGLE_ABI,
        functionName: 'deployERC1167Proxy',
        args: [kmSalt, 0n, KM_IMPLEMENTATION, kmInitCalldata],
        account,
      });

      const kmTxHash = await walletClient.writeContract(kmRequest);
      console.log(`   Transaction: ${kmTxHash}`);
      
      const kmReceipt = await publicClient.waitForTransactionReceipt({ hash: kmTxHash });
      console.log(`   ✅ KM deployed at: ${expectedKM}`);
      console.log(`   Block: ${kmReceipt.blockNumber}`);
      console.log('');

      // Save results
      const result = {
        success: true,
        network: 'LUKSO Mainnet',
        chainId: 42,
        walletAddress,
        contracts: {
          LSP0ERC725Account: {
            address: expectedUP,
            deployTx: upTxHash,
          },
          LSP6KeyManager: {
            address: expectedKM,
            deployTx: kmTxHash,
          },
        },
        timestamp: new Date().toISOString(),
      };

      writeFileSync('up-deployment-result.json', JSON.stringify(result, null, 2));

      console.log('🎉 SUCCESS! Universal Profile Deployed');
      console.log('======================================================');
      console.log(`📍 Universal Profile Address: ${expectedUP}`);
      console.log(`🔐 Key Manager Address: ${expectedKM}`);
      console.log(`⛽ UP Tx: ${upTxHash}`);
      console.log(`⛽ KM Tx: ${kmTxHash}`);
      console.log('');

      return result;

    } catch (error) {
      console.error('');
      console.error('❌ Deployment failed');
      console.error('Error:', error.message);
      
      // Check if the error is about non-existent function
      if (error.message.includes('call revert exception') || error.message.includes('missing revert data')) {
        console.error('');
        console.error('💡 The LSP23 factory may not support single proxy deployment.');
        console.error('   This is a limitation of the current factory implementation.');
      }
      
      writeFileSync('up-deployment-error-separate.json', JSON.stringify({
        success: false,
        error: error.message,
      }, null, 2));
      
      return { success: false, error: error.message };
    }

  } catch (error) {
    console.error('');
    console.error('❌ DEPLOYMENT FAILED');
    console.error('======================================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('');

    return { success: false, error: error.message };
  }
}

deploySeparately()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
