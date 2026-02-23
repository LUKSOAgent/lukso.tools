import { createPublicClient, createWalletClient, http, defineChain, hexToBytes } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { LSPFactory } from '@lukso/lsp-factory.js';
import { writeFileSync } from 'fs';

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

async function deployUniversalProfile() {
  console.log('🚀 Starting Universal Profile Deployment');
  console.log('==========================================');
  console.log('Network: LUKSO Mainnet (Chain ID: 42)');
  console.log('LSP23 Factory: 0x2300000A84D25dF63081feAa37ba6b62C4c89a30');
  console.log('');

  try {
    // Generate a new wallet
    console.log('🔑 Generating new wallet...');
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const walletAddress = account.address;
    
    console.log('✅ Wallet generated!');
    console.log(`   Address: ${walletAddress}`);
    console.log(`   Private Key: ${privateKey}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Save this private key and fund the address with LYX!');
    console.log('');

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
    console.log(`   Balance: ${balance} wei (${Number(balance) / 1e18} LYX)`);
    console.log('');

    if (balance === 0n) {
      console.log('❌ ERROR: Wallet has no LYX!');
      console.log(`   Please fund ${walletAddress} with LYX before deploying.`);
      console.log('');
      
      // Save credentials for later
      const credentials = {
        network: 'LUKSO Mainnet',
        chainId: 42,
        walletAddress,
        privateKey,
        lsp23Factory: '0x2300000A84D25dF63081feAa37ba6b62C4c89a30',
        status: 'PENDING_FUNDING',
        timestamp: new Date().toISOString(),
      };
      writeFileSync('up-deployment-credentials.json', JSON.stringify(credentials, null, 2));
      console.log('💾 Credentials saved to up-deployment-credentials.json');
      
      return {
        success: false,
        error: 'WALLET_NOT_FUNDED',
        walletAddress,
        privateKey,
        message: 'Wallet needs LYX funding before deployment can proceed',
      };
    }

    // Initialize LSPFactory
    console.log('🏭 Initializing LSPFactory...');
    const lspFactory = new LSPFactory(publicClient, walletClient);
    console.log('✅ LSPFactory initialized');
    console.log('');

    // Deploy Universal Profile
    console.log('📋 Deployment Configuration:');
    console.log('   - Controller: ' + walletAddress);
    console.log('   - Using LSP23 Factory for proxy deployment');
    console.log('');
    console.log('⏳ Deploying Universal Profile...');
    console.log('   (This may take 1-2 minutes)');
    console.log('');

    const deploymentEvents = [];
    
    const result = await lspFactory.UniversalProfile.deploy(
      {
        controllerAddresses: [walletAddress],
      },
      {
        version: '0.14.0',
        onDeployEvents: {
          next: (event) => {
            console.log(`   📡 Event: ${event.contractName} - ${event.status}`);
            if (event.txHash) {
              console.log(`      Tx: ${event.txHash}`);
            }
            deploymentEvents.push(event);
          },
          error: (error) => {
            console.error('   ❌ Deployment error:', error.message);
          },
          complete: (contracts) => {
            console.log('');
            console.log('✅ Deployment Complete!');
            console.log('==========================================');
          },
        },
      }
    );

    const { LSP0ERC725Account, LSP6KeyManager } = result;

    console.log('');
    console.log('🎉 SUCCESS! Universal Profile Deployed');
    console.log('==========================================');
    console.log(`📍 Universal Profile Address: ${LSP0ERC725Account.address}`);
    console.log(`🔐 Key Manager Address: ${LSP6KeyManager.address}`);
    console.log(`⛽ Transaction Hash: ${LSP0ERC725Account.receipt?.transactionHash || 'N/A'}`);
    console.log(`📦 Block Number: ${LSP0ERC725Account.receipt?.blockNumber || 'N/A'}`);
    console.log('');

    // Save deployment results
    const deploymentResult = {
      success: true,
      network: 'LUKSO Mainnet',
      chainId: 42,
      walletAddress,
      privateKey,
      lsp23Factory: '0x2300000A84D25dF63081feAa37ba6b62C4c89a30',
      contracts: {
        LSP0ERC725Account: {
          address: LSP0ERC725Account.address,
          receipt: {
            transactionHash: LSP0ERC725Account.receipt?.transactionHash,
            blockNumber: Number(LSP0ERC725Account.receipt?.blockNumber),
            gasUsed: LSP0ERC725Account.receipt?.gasUsed?.toString(),
          },
        },
        LSP6KeyManager: {
          address: LSP6KeyManager.address,
        },
      },
      events: deploymentEvents.map(e => ({
        type: e.type,
        status: e.status,
        contractName: e.contractName,
        functionName: e.functionName,
        txHash: e.txHash,
      })),
      timestamp: new Date().toISOString(),
    };

    writeFileSync('up-deployment-result.json', JSON.stringify(deploymentResult, null, 2));
    console.log('💾 Deployment result saved to up-deployment-result.json');
    console.log('');

    return deploymentResult;

  } catch (error) {
    console.error('');
    console.error('❌ DEPLOYMENT FAILED');
    console.error('==========================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('');

    // Save error details
    const errorResult = {
      success: false,
      network: 'LUKSO Mainnet',
      chainId: 42,
      lsp23Factory: '0x2300000A84D25dF63081feAa37ba6b62C4c89a30',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };

    writeFileSync('up-deployment-error.json', JSON.stringify(errorResult, null, 2));
    console.log('💾 Error details saved to up-deployment-error.json');

    return errorResult;
  }
}

// Run the deployment
deployUniversalProfile()
  .then((result) => {
    if (result.success) {
      console.log('✅ Deployment script completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Deployment script failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
