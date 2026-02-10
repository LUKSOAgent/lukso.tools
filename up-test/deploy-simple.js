const { ethers } = require('ethers');

// LUKSO Mainnet
const RPC_URL = 'https://rpc.mainnet.lukso.network';
const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
const UP_IMPLEMENTATION = '0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F';
const LSP6_IMPLEMENTATION = '0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4';

// Minimal ABIs
const UP_ABI = ['function initialize(address newOwner) external'];
const LSP23_ABI = [
  'function deployERC1167Proxies(tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata) external payable returns (address primaryContractAddress, address secondaryContractAddress)',
  'event DeployedERC1167Proxies(address indexed primaryContract, address indexed secondaryContract, tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata)'
];

async function deploySimple() {
  console.log('🚀 Simple UP Deployment - MAINNET\n');

  const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_6';
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('Controller:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.utils.formatEther(balance), 'LYX\n');

  const lsp23 = new ethers.Contract(LSP23_FACTORY, LSP23_ABI, wallet);
  const upInterface = new ethers.utils.Interface(UP_ABI);

  // Just deploy UP only first - no KeyManager
  const upInitData = upInterface.encodeFunctionData('initialize', [wallet.address]);
  
  const primaryDeployment = {
    salt: ethers.utils.randomBytes(32),
    fundingAmount: 0,
    implementationContract: UP_IMPLEMENTATION,
    initializationCalldata: upInitData
  };

  // Empty secondary deployment - just to satisfy the function signature
  const secondaryDeployment = {
    fundingAmount: 0,
    implementationContract: ethers.constants.AddressZero, // No implementation
    initializationCalldata: '0x',
    addPrimaryContractAddress: false,
    extraInitializationParams: '0x'
  };

  try {
    console.log('Deploying UP only...');
    
    // Try to call the function with just UP deployment
    // This might fail if the factory requires both contracts
    const tx = await lsp23.deployERC1167Proxies(
      primaryDeployment,
      secondaryDeployment,
      ethers.constants.AddressZero,
      '0x',
      { gasLimit: 3000000 }
    );

    console.log('Transaction:', tx.hash);
    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
      console.log('❌ Reverted');
      return;
    }

    const event = receipt.events?.find(e => e.event === 'DeployedERC1167Proxies');
    console.log('✅ Success!');
    console.log('UP Address:', event?.args?.primaryContract);
    console.log('KeyManager:', event?.args?.secondaryContract);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('invalid deployment')) {
      console.log('The factory requires both UP and KeyManager. Trying alternative...');
    }
  }
}

deploySimple();