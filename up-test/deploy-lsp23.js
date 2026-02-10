const { ethers } = require('ethers');

// LSP23 Factory addresses
const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
const POST_DEPLOYMENT_MODULE = '0x000000000066093407b6704B89793beFfD0D8F00';

// Implementation contract addresses (v0.14.0)
const UNIVERSAL_PROFILE_IMPLEMENTATION = '0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F';
const LSP6_KEY_MANAGER_IMPLEMENTATION = '0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4';
const LSP1_URD_IMPLEMENTATION = '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D';

// Minimal ABI for LSP23 factory
const LSP23_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"internalType": "bytes32", "name": "salt", "type": "bytes32"},
          {"internalType": "uint256", "name": "fundingAmount", "type": "uint256"},
          {"internalType": "address", "name": "implementationContract", "type": "address"},
          {"internalType": "bytes", "name": "initializationCalldata", "type": "bytes"}
        ],
        "internalType": "struct ILSP23LinkedContractsFactory.PrimaryContractDeploymentInit",
        "name": "primaryContractDeploymentInit",
        "type": "tuple"
      },
      {
        "components": [
          {"internalType": "uint256", "name": "fundingAmount", "type": "uint256"},
          {"internalType": "address", "name": "implementationContract", "type": "address"},
          {"internalType": "bytes", "name": "initializationCalldata", "type": "bytes"},
          {"internalType": "bool", "name": "addPrimaryContractAddress", "type": "bool"},
          {"internalType": "bytes", "name": "extraInitializationParams", "type": "bytes"}
        ],
        "internalType": "struct ILSP23LinkedContractsFactory.SecondaryContractDeploymentInit",
        "name": "secondaryContractDeploymentInit",
        "type": "tuple"
      },
      {"internalType": "address", "name": "postDeploymentModule", "type": "address"},
      {"internalType": "bytes", "name": "postDeploymentModuleCalldata", "type": "bytes"}
    ],
    "name": "deployERC1167Proxies",
    "outputs": [
      {"internalType": "address", "name": "primaryContractAddress", "type": "address"},
      {"internalType": "address", "name": "secondaryContractAddress", "type": "address"}
    ],
    "stateMutability": "payable",
    "type": "function"
  }
];

// Universal Profile ABI (minimal for initialization)
const UP_ABI = [
  "function initialize(address newOwner) external",
  "function setData(bytes32 dataKey, bytes memory dataValue) external",
];

// Key Manager ABI (minimal for initialization)
const LSP6_ABI = [
  "function initialize(address target, address[] memory controllers, bytes32[] memory permissions) external",
];

async function deployViaLSP23() {
  console.log('🚀 Starting Universal Profile deployment via LSP23 Factory...\n');

  // Generate a new random wallet for the controller
  const wallet = ethers.Wallet.createRandom();
  console.log('✅ Controller Wallet Generated');
  console.log('   Address:', wallet.address);
  console.log('   Private Key:', wallet.privateKey);
  console.log();

  // Connect to LUKSO testnet (using testnet for testing)
  const RPC_URL = 'https://rpc.testnet.lukso.network';
  const CHAIN_ID = 4201;
  
  console.log('🔗 Connecting to LUKSO testnet...');
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(wallet.privateKey, provider);
  
  console.log('✅ Connected to LUKSO testnet (chainId:', CHAIN_ID, ')\n');

  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Controller Balance:', ethers.utils.formatEther(balance), 'LYX');
  console.log();

  if (balance.eq(0)) {
    console.log('⚠️  WARNING: Wallet has no test LYX!');
    console.log('   Get test LYX from: https://faucet.testnet.lukso.network');
    console.log('   Send to address:', wallet.address);
    console.log();
    console.log('   Attempting deployment anyway (will fail without gas)...');
    console.log();
  }

  // Create LSP23 factory contract instance
  const lsp23Factory = new ethers.Contract(LSP23_FACTORY, LSP23_ABI, signer);

  // Prepare initialization data for Universal Profile
  const upInterface = new ethers.utils.Interface(UP_ABI);
  const upInitData = upInterface.encodeFunctionData('initialize', [wallet.address]);

  // Prepare initialization data for Key Manager
  // The Key Manager needs to be initialized with the UP address as target
  // We'll need to compute this or use a placeholder
  const lsp6Interface = new ethers.utils.Interface(LSP6_ABI);
  
  // For now, let's try with empty extra params - the post deployment module should handle setup
  const kmInitData = lsp6Interface.encodeFunctionData('initialize', [
    ethers.constants.AddressZero, // Will be replaced with actual UP address by post-deployment module
    [wallet.address],
    [ethers.utils.hexZeroPad('0x01', 32)] // Simple permission
  ]);

  // Prepare the deployment parameters
  const primaryDeployment = {
    salt: ethers.utils.randomBytes(32),
    fundingAmount: 0,
    implementationContract: UNIVERSAL_PROFILE_IMPLEMENTATION,
    initializationCalldata: upInitData
  };

  const secondaryDeployment = {
    fundingAmount: 0,
    implementationContract: LSP6_KEY_MANAGER_IMPLEMENTATION,
    initializationCalldata: kmInitData,
    addPrimaryContractAddress: true, // This will append the UP address to the initialization
    extraInitializationParams: '0x'
  };

  console.log('📋 Deployment Configuration:');
  console.log('   Controller:', wallet.address);
  console.log('   UP Implementation:', UNIVERSAL_PROFILE_IMPLEMENTATION);
  console.log('   KeyManager Implementation:', LSP6_KEY_MANAGER_IMPLEMENTATION);
  console.log();

  console.log('⏳ Deploying Universal Profile via LSP23 Factory...');
  
  try {
    // Call deployERC1167Proxies
    const tx = await lsp23Factory.deployERC1167Proxies(
      primaryDeployment,
      secondaryDeployment,
      POST_DEPLOYMENT_MODULE,
      '0x', // Empty post deployment calldata for now
      { gasLimit: 5000000 } // Set a gas limit
    );

    console.log('📤 Transaction sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...');

    const receipt = await tx.wait();
    
    // Parse the receipt for the deployed addresses
    // The factory emits events with the deployed addresses
    console.log('\n✅ Deployment transaction confirmed!');
    console.log('📊 Transaction Receipt:');
    console.log('   Block Number:', receipt.blockNumber);
    console.log('   Gas Used:', receipt.gasUsed.toString());
    console.log('   Status:', receipt.status === 1 ? 'Success' : 'Failed');
    
    // Try to extract addresses from events
    // The factory should emit events with the deployed addresses
    console.log('\n📋 Raw Events:', receipt.events?.length || 0, 'events');
    receipt.logs?.forEach((log, i) => {
      console.log(`   Event ${i}:`, log.address, log.topics[0]);
    });

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

deployViaLSP23()
  .then(() => {
    console.log('\n✨ Deployment process complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  });