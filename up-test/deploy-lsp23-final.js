const { ethers } = require('ethers');

// Contract Addresses
const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
const POST_DEPLOYMENT_MODULE = '0x000000000066093407b6704B89793beFfD0D8F00';

// Implementation Addresses (v0.14.0)
const UP_IMPLEMENTATION = '0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F';
const LSP6_IMPLEMENTATION = '0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4';
const LSP1_URD = '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D';

// Minimal ABIs
const UP_ABI = ['function initialize(address newOwner) external'];
const LSP6_ABI = ['function initialize(address target, address[] calldata controllers, bytes32[] calldata permissions) external'];
const LSP23_ABI = [
  'function deployERC1167Proxies(tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata) external payable returns (address primaryContractAddress, address secondaryContractAddress)',
  'event DeployedERC1167Proxies(address indexed primaryContract, address indexed secondaryContract, tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata)'
];

async function deployUniversalProfile() {
  console.log('🚀 LUKSO Universal Profile Deployment via LSP23 Factory\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Generate controller wallet
  const wallet = ethers.Wallet.createRandom();
  console.log('✅ Controller Wallet Generated');
  console.log('   Address:', wallet.address);
  console.log('   Private Key:', wallet.privateKey);
  console.log();

  // Connect to LUKSO testnet
  const provider = new ethers.providers.JsonRpcProvider('https://rpc.testnet.lukso.network');
  const signer = new ethers.Wallet(wallet.privateKey, provider);
  
  console.log('🔗 Connected to LUKSO Testnet (Chain ID: 4201)');
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.utils.formatEther(balance), 'LYX\n');

  if (balance.eq(0)) {
    console.log('⚠️  INSUFFICIENT FUNDS\n');
    console.log('To complete this deployment, you need test LYX.');
    console.log('\n📋 Options to get test LYX:');
    console.log('   1. Visit https://faucet.testnet.lukso.network');
    console.log('   2. Post a tweet with your address:', wallet.address);
    console.log('   3. Submit the tweet URL to the faucet');
    console.log('   4. Wait for 1-10 LYXt to arrive');
    console.log('\n   OR use an existing funded wallet\n');
    
    console.log('📝 Wallet Details for Funding:');
    console.log('   Address:    ', wallet.address);
    console.log('   Private Key:', wallet.privateKey);
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
    // Return early but save wallet info
    return {
      status: 'NEEDS_FUNDING',
      wallet: {
        address: wallet.address,
        privateKey: wallet.privateKey
      }
    };
  }

  // Create contract instances
  const lsp23 = new ethers.Contract(LSP23_FACTORY, LSP23_ABI, signer);
  const upInterface = new ethers.utils.Interface(UP_ABI);
  const lsp6Interface = new ethers.utils.Interface(LSP6_ABI);

  // Prepare initialization data
  const upInitData = upInterface.encodeFunctionData('initialize', [wallet.address]);
  
  // For KeyManager: set the controller with full permissions (SUPER_ADMIN = 0x0000000000000000000000000000000000000000000000000000000000000001)
  const ALL_PERMISSIONS = '0x0000000000000000000000000000000000000000000000000000000000000001';
  const kmInitData = lsp6Interface.encodeFunctionData('initialize', [
    ethers.constants.AddressZero, // Will be replaced by factory with UP address
    [wallet.address],
    [ALL_PERMISSIONS]
  ]);

  // Deployment parameters
  const primaryDeployment = {
    salt: ethers.utils.randomBytes(32),
    fundingAmount: 0,
    implementationContract: UP_IMPLEMENTATION,
    initializationCalldata: upInitData
  };

  const secondaryDeployment = {
    fundingAmount: 0,
    implementationContract: LSP6_IMPLEMENTATION,
    initializationCalldata: kmInitData,
    addPrimaryContractAddress: true, // Factory will append UP address
    extraInitializationParams: '0x'
  };

  console.log('📋 Deployment Configuration:');
  console.log('   Controller:', wallet.address);
  console.log('   UP Implementation:', UP_IMPLEMENTATION);
  console.log('   KeyManager Implementation:', LSP6_IMPLEMENTATION);
  console.log('   Post Deployment Module:', POST_DEPLOYMENT_MODULE);
  console.log();

  try {
    console.log('⏳ Deploying Universal Profile...\n');
    
    const tx = await lsp23.deployERC1167Proxies(
      primaryDeployment,
      secondaryDeployment,
      POST_DEPLOYMENT_MODULE,
      '0x',
      { gasLimit: 5000000 }
    );

    console.log('📤 Transaction Sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...\n');

    const receipt = await tx.wait();

    // Parse the DeployedERC1167Proxies event
    const event = receipt.events?.find(e => e.event === 'DeployedERC1167Proxies');
    
    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESULTS:');
    console.log('   Controller Address:     ', wallet.address);
    console.log('   Controller Private Key: ', wallet.privateKey);
    
    if (event) {
      console.log('   UP (LSP0) Address:      ', event.args.primaryContract);
      console.log('   KeyManager (LSP6) Address:', event.args.secondaryContract);
    }
    
    console.log('   Transaction Hash:       ', receipt.transactionHash);
    console.log('   Block Number:           ', receipt.blockNumber);
    console.log('   Gas Used:               ', receipt.gasUsed.toString());
    console.log('═══════════════════════════════════════════════════════════\n');

    return {
      status: 'SUCCESS',
      controllerAddress: wallet.address,
      controllerPrivateKey: wallet.privateKey,
      upAddress: event?.args?.primaryContract,
      keyManagerAddress: event?.args?.secondaryContract,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };

  } catch (error) {
    console.error('❌ Deployment Failed:', error.message);
    if (error.message.includes('insufficient funds')) {
      console.error('\n⚠️  Not enough LYX for gas fees');
    }
    throw error;
  }
}

deployUniversalProfile()
  .then((result) => {
    if (result.status === 'NEEDS_FUNDING') {
      console.log('⏸️  Deployment paused - waiting for funds');
      process.exit(0);
    } else {
      console.log('✨ Complete!');
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
  });