const { ethers } = require('ethers');

// LUKSO Mainnet
const RPC_URL = 'https://rpc.mainnet.lukso.network';
const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
const UP_IMPLEMENTATION = '0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F';
const LSP6_IMPLEMENTATION = '0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4';

// ABIs
const UP_ABI = ['function initialize(address newOwner) external'];
const LSP6_ABI = ['function initialize(address target, address[] calldata controllers, bytes32[] calldata permissions) external'];
const LSP23_ABI = [
  'function computeERC1167Addresses(tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata) external view returns (address primaryContractAddress, address secondaryContractAddress)',
  'function deployERC1167Proxies(tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata) external payable returns (address primaryContractAddress, address secondaryContractAddress)',
  'event DeployedERC1167Proxies(address indexed primaryContract, address indexed secondaryContract, tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata)'
];

async function deployWithComputedAddress() {
  console.log('🚀 LSP23 Deployment with Computed Address\n');

  const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_6';
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('Controller:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.utils.formatEther(balance), 'LYX\n');

  const lsp23 = new ethers.Contract(LSP23_FACTORY, LSP23_ABI, wallet);
  const upInterface = new ethers.utils.Interface(UP_ABI);
  const lsp6Interface = new ethers.utils.Interface(LSP6_ABI);

  // Use a fixed salt for determinism (or random if you prefer)
  const salt = ethers.utils.randomBytes(32);
  
  // Step 1: Prepare UP initialization (this doesn't depend on KeyManager)
  const upInitData = upInterface.encodeFunctionData('initialize', [wallet.address]);
  
  // Step 2: For KeyManager, we need to compute the UP address first
  // Use addPrimaryContractAddress = false since we'll compute and use the actual address
  const kmPlaceholderInitData = lsp6Interface.encodeFunctionData('initialize', [
    ethers.constants.AddressZero, // placeholder
    [wallet.address],
    ['0x0000000000000000000000000000000000000000000000000000000000000001']
  ]);

  const primaryDeployment = {
    salt: salt,
    fundingAmount: 0,
    implementationContract: UP_IMPLEMENTATION,
    initializationCalldata: upInitData
  };

  const secondaryDeployment = {
    fundingAmount: 0,
    implementationContract: LSP6_IMPLEMENTATION,
    initializationCalldata: kmPlaceholderInitData,
    addPrimaryContractAddress: false, // We'll use computed address
    extraInitializationParams: '0x'
  };

  // Step 3: Compute the addresses
  console.log('Computing addresses...');
  try {
    const [upAddress, kmAddress] = await lsp23.computeERC1167Addresses(
      primaryDeployment,
      secondaryDeployment,
      ethers.constants.AddressZero,
      '0x'
    );
    
    console.log('Computed UP Address:', upAddress);
    console.log('Computed KeyManager Address:', kmAddress);
    console.log();

    // Step 4: Now prepare the REAL KeyManager initialization with the computed UP address
    const kmRealInitData = lsp6Interface.encodeFunctionData('initialize', [
      upAddress, // Use the computed address
      [wallet.address],
      ['0x0000000000000000000000000000000000000000000000000000000000000001']
    ]);

    const realSecondaryDeployment = {
      fundingAmount: 0,
      implementationContract: LSP6_IMPLEMENTATION,
      initializationCalldata: kmRealInitData,
      addPrimaryContractAddress: false,
      extraInitializationParams: '0x'
    };

    console.log('Deploying with computed addresses...\n');

    // Step 5: Deploy both contracts
    const tx = await lsp23.deployERC1167Proxies(
      primaryDeployment,
      realSecondaryDeployment,
      ethers.constants.AddressZero,
      '0x',
      { gasLimit: 5000000 }
    );

    console.log('Transaction:', tx.hash);
    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
      console.log('❌ Transaction reverted');
      console.log('Gas used:', receipt.gasUsed.toString());
      return;
    }

    const event = receipt.events?.find(e => e.event === 'DeployedERC1167Proxies');
    
    console.log('\n✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESULTS:');
    console.log('   Controller Address:     ', wallet.address);
    console.log('   Controller Private Key: ', PRIVATE_KEY);
    console.log('   UP (LSP0) Address:      ', event?.args?.primaryContract || upAddress);
    console.log('   KeyManager Address:     ', event?.args?.secondaryContract || kmAddress);
    console.log('   Transaction Hash:       ', receipt.transactionHash);
    console.log('   Block Number:           ', receipt.blockNumber);
    console.log('   Gas Used:               ', receipt.gasUsed.toString());
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('execution reverted')) {
      console.log('\nThe compute function may not be working as expected.');
      console.log('Trying direct deployment with placeholder...');
    }
  }
}

deployWithComputedAddress();