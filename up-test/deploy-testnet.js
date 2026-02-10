const { ethers } = require('ethers');
const { LSPFactory } = require('@lukso/lsp-factory.js');

async function deployUniversalProfile() {
  console.log('🚀 Starting Universal Profile deployment on TESTNET...\n');

  // Generate a new random wallet for the controller
  const wallet = ethers.Wallet.createRandom();
  console.log('✅ Controller Wallet Generated');
  console.log('   Address:', wallet.address);
  console.log('   Private Key:', wallet.privateKey);
  console.log();

  // Testnet RPC
  const RPC_URL = 'https://rpc.testnet.lukso.network';
  const CHAIN_ID = 4201;
  
  // Initialize LSPFactory with LUKSO testnet
  console.log('🔗 Connecting to LUKSO testnet...');
  
  // Create a provider
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(wallet.privateKey, provider);
  
  const lspFactory = new LSPFactory(RPC_URL, {
    deployKey: wallet.privateKey,
    chainId: CHAIN_ID,
  });
  console.log('✅ Connected to LUKSO testnet (chainId:', CHAIN_ID, ')\n');

  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Controller Balance:', ethers.utils.formatEther(balance), 'LYX');
  console.log();
  
  if (balance.eq(0)) {
    console.log('⚠️  WARNING: Wallet has no test LYX!');
    console.log('   You can get test LYX from the LUKSO testnet faucet:');
    console.log('   https://faucet.testnet.lukso.network');
    console.log();
    console.log('   Send test LYX to:', wallet.address);
    console.log();
    console.log('   Attempting deployment anyway (will fail without gas)...');
    console.log();
  }

  // Deploy the Universal Profile WITHOUT LSP3 metadata first (to avoid IPFS issues)
  console.log('📋 Deployment Configuration:');
  console.log('   Name: "TestAgent-UP"');
  console.log('   Description: "Testing UP creation via lsp-factory"');
  console.log('   Tags: ["test", "agent"]');
  console.log('   Controller:', wallet.address);
  console.log();

  console.log('⏳ Deploying Universal Profile... (this may take a few minutes)');
  
  try {
    // Deploy without profile metadata to avoid IPFS issues
    const deployedContracts = await lspFactory.UniversalProfile.deploy({
      controllingAccounts: [wallet.address],
    }, {
      // Skip IPFS upload
      uploadOptions: {
        ipfsClientOptions: null,
      }
    });

    console.log('\n✅ Universal Profile Deployed Successfully!\n');
    console.log('📊 DEPLOYMENT RESULTS:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Network:                ', 'LUKSO Testnet (chainId: 4201)');
    console.log('Controller Address:     ', wallet.address);
    console.log('Controller Private Key: ', wallet.privateKey);
    console.log('UP (LSP0) Address:      ', deployedContracts.LSP0ERC725Account?.address);
    console.log('KeyManager (LSP6) Address:', deployedContracts.LSP6KeyManager?.address);
    
    // Get transaction hash if available
    const receipt = deployedContracts.LSP0ERC725Account?.receipt;
    if (receipt) {
      console.log('Transaction Hash:       ', receipt.transactionHash);
    }
    console.log('═══════════════════════════════════════════════════════');

    return {
      controllerAddress: wallet.address,
      controllerPrivateKey: wallet.privateKey,
      upAddress: deployedContracts.LSP0ERC725Account?.address,
      keyManagerAddress: deployedContracts.LSP6KeyManager?.address,
      transactionHash: receipt?.transactionHash
    };
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    if (error.message.includes('insufficient funds')) {
      console.error('\n⚠️  The wallet needs test LYX for gas fees.');
      console.error('   Get test LYX from: https://faucet.testnet.lukso.network');
      console.error('   Send to address:', wallet.address);
    }
    throw error;
  }
}

deployUniversalProfile()
  .then((result) => {
    console.log('\n✨ Deployment complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  });