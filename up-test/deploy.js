const { ethers } = require('ethers');
const { LSPFactory } = require('@lukso/lsp-factory.js');

async function deployUniversalProfile() {
  console.log('🚀 Starting Universal Profile deployment...\n');

  // Generate a new random wallet for the controller
  const wallet = ethers.Wallet.createRandom();
  console.log('✅ Controller Wallet Generated');
  console.log('   Address:', wallet.address);
  console.log('   Private Key:', wallet.privateKey);
  console.log();

  // Initialize LSPFactory with LUKSO mainnet
  console.log('🔗 Connecting to LUKSO mainnet...');
  
  // Create a provider
  const provider = new ethers.providers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const signer = new ethers.Wallet(wallet.privateKey, provider);
  
  const lspFactory = new LSPFactory('https://rpc.mainnet.lukso.network', {
    deployKey: wallet.privateKey,
    chainId: 42,
  });
  console.log('✅ Connected to LUKSO mainnet (chainId: 42)\n');

  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Controller Balance:', ethers.utils.formatEther(balance), 'LYX');
  console.log();

  // Deploy the Universal Profile WITHOUT LSP3 metadata first (to avoid IPFS issues)
  console.log('📋 Deployment Configuration:');
  console.log('   Name: "TestAgent-UP"');
  console.log('   Description: "Testing UP creation via lsp-factory"');
  console.log('   Tags: ["test", "agent"]');
  console.log('   Controller:', wallet.address);
  console.log();

  console.log('⏳ Deploying Universal Profile without metadata... (this may take a few minutes)');
  
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
    console.error('\nFull error:', error);
    throw error;
  }
}

deployUniversalProfile()
  .then((result) => {
    console.log('\n✨ Deployment complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });