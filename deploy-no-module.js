const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_6';
const CONTROLLER = '0xf4dF36124d5D1bBEc1EE55CA20F70905E0f59e2b';
const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
const UP_IMPLEMENTATION = '0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F';
const KM_IMPLEMENTATION = '0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4';

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const LSP23_ABI = [
  "function deployERC1167Proxies(tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata) external payable returns (address primaryContractAddress, address secondaryContractAddress)"
];

const UP_ABI = ["function initialize(address initialOwner) external"];
const KM_ABI = ["function initialize(address target, address[] calldata controllers, uint256[] calldata permissions) external"];

async function deploy() {
  console.log('🚀 Deploying without PostDeploymentModule...\n');
  
  const salt = ethers.hexlify(ethers.randomBytes(32));
  
  // Encode UP initialization
  const upInterface = new ethers.Interface(UP_ABI);
  const upInitCalldata = upInterface.encodeFunctionData('initialize', [CONTROLLER]);
  
  // Encode KM initialization - simpler version
  const kmInterface = new ethers.Interface(KM_ABI);
  const kmInitCalldata = kmInterface.encodeFunctionData('initialize', [
    ethers.ZeroAddress, // Will be replaced with UP address
    [CONTROLLER],
    [ethers.MaxUint256] // All permissions
  ]);
  
  const factory = new ethers.Contract(LSP23_FACTORY, LSP23_ABI, wallet);
  
  const primaryDeployment = {
    salt: salt,
    fundingAmount: 0,
    implementationContract: UP_IMPLEMENTATION,
    initializationCalldata: upInitCalldata
  };
  
  const secondaryDeployment = {
    fundingAmount: 0,
    implementationContract: KM_IMPLEMENTATION,
    initializationCalldata: kmInitCalldata,
    addPrimaryContractAddress: true,
    extraInitializationParams: '0x'
  };
  
  // Try without PostDeploymentModule
  console.log('Deploying with postDeploymentModule = address(0)...');
  
  try {
    const tx = await factory.deployERC1167Proxies(
      primaryDeployment,
      secondaryDeployment,
      ethers.ZeroAddress, // No post deployment module
      '0x',
      { gasLimit: 5000000 }
    );
    
    console.log('⏳ Transaction:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    
    // Try to decode revert reason
    if (err.receipt) {
      console.log('Receipt status:', err.receipt.status);
      console.log('Gas used:', err.receipt.gasUsed.toString());
    }
  }
}

deploy().catch(console.error);
