const { ethers } = require('ethers');

// LUKSO Mainnet Configuration
const RPC_URL = 'https://rpc.mainnet.lukso.network';
const CHAIN_ID = 42;

// Contract Addresses
const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
const UP_IMPLEMENTATION = '0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F';
const LSP6_IMPLEMENTATION = '0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4';

// ABIs
const UP_ABI = ['function initialize(address newOwner) external'];
const LSP6_ABI = ['function initialize(address target, address[] calldata controllers, bytes32[] calldata permissions) external'];
const LSP23_ABI = [
  'function deployERC1167Proxies(tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata) external payable returns (address primaryContractAddress, address secondaryContractAddress)',
  'event DeployedERC1167Proxies(address indexed primaryContract, address indexed secondaryContract, tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata)'
];

async function deployWithoutPostModule() {
  console.log('🚀 LUKSO Universal Profile Deployment - MAINNET (Retry)\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Controller wallet
  const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_6';
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔑 Controller Wallet');
  console.log('   Address:', wallet.address);
  console.log('   Previous tx failed, retrying without post-deployment module...\n');

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.utils.formatEther(balance), 'LYX\n');

  // Create contract instances
  const lsp23 = new ethers.Contract(LSP23_FACTORY, LSP23_ABI, wallet);
  const upInterface = new ethers.utils.Interface(UP_ABI);
  const lsp6Interface = new ethers.utils.Interface(LSP6_ABI);

  // Prepare initialization data for UP - initialize with controller as owner
  const upInitData = upInterface.encodeFunctionData('initialize', [wallet.address]);
  
  // For KeyManager: initialize with UP address as target (will be set after UP deployment)
  // The factory should inject the UP address when addPrimaryContractAddress = true
  const ALL_PERMISSIONS = '0x0000000000000000000000000000000000000000000000000000000000000001';
  
  // Initialize with placeholder - actual UP address will be appended by factory
  const kmInitData = lsp6Interface.encodeFunctionData('initialize', [
    ethers.constants.AddressZero, // Placeholder - factory replaces this
    [wallet.address],             // Controller
    [ALL_PERMISSIONS]             // Full permissions
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
    addPrimaryContractAddress: true, // This tells factory to append UP address to calldata
    extraInitializationParams: '0x'
  };

  console.log('📋 Deployment Configuration (v2):');
  console.log('   Network: LUKSO Mainnet (Chain ID: 42)');
  console.log('   Controller:', wallet.address);
  console.log('   Post-Deployment Module: None (address 0)');
  console.log();

  try {
    console.log('⏳ Deploying Universal Profile (without post-deployment module)...\n');
    
    // Try without post-deployment module (address 0)
    const tx = await lsp23.deployERC1167Proxies(
      primaryDeployment,
      secondaryDeployment,
      ethers.constants.AddressZero, // No post-deployment module
      '0x',
      { gasLimit: 5000000 }
    );

    console.log('📤 Transaction Sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...\n');

    const receipt = await tx.wait();
    
    // Check status
    if (receipt.status === 0) {
      console.log('❌ Transaction reverted again');
      console.log('   Gas Used:', receipt.gasUsed.toString());
      console.log('   Block:', receipt.blockNumber);
      console.log('\n   Likely cause: The LSP6 initialize params may be incorrect');
      console.log('   The factory appends the UP address to the end of the calldata,');
      console.log('   which shifts the parameter positions.');
      return { status: 'REVERTED', receipt };
    }

    const event = receipt.events?.find(e => e.event === 'DeployedERC1167Proxies');
    
    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESULTS:');
    console.log('   Controller Address:     ', wallet.address);
    console.log('   Controller Private Key: ', PRIVATE_KEY);
    
    if (event) {
      console.log('   UP (LSP0) Address:      ', event.args.primaryContract);
      console.log('   KeyManager Address:     ', event.args.secondaryContract);
    }
    
    console.log('   Transaction Hash:       ', receipt.transactionHash);
    console.log('   Block Number:           ', receipt.blockNumber);
    console.log('   Gas Used:               ', receipt.gasUsed.toString());
    console.log('═══════════════════════════════════════════════════════════\n');

    return {
      status: 'SUCCESS',
      controllerAddress: wallet.address,
      controllerPrivateKey: PRIVATE_KEY,
      upAddress: event?.args?.primaryContract,
      keyManagerAddress: event?.args?.secondaryContract,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };

  } catch (error) {
    console.error('❌ Deployment Failed:', error.message);
    throw error;
  }
}

deployWithoutPostModule()
  .then((result) => {
    if (result.status === 'REVERTED') {
      console.log('\n⚠️  Transaction reverted - may need different initialization approach');
    } else {
      console.log('✨ Complete!');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  });