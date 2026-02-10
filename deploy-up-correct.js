const { ethers } = require('ethers');

// Test controller (has 0.5 LYX)
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_6';
const CONTROLLER = '0xf4dF36124d5D1bBEc1EE55CA20F70905E0f59e2b';

// LSP23 Factory (mainnet)
const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';

// Implementation addresses (v0.14.0)
const UP_IMPLEMENTATION = '0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F';
const KM_IMPLEMENTATION = '0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4';
const POST_DEPLOY_MODULE = '0x000000000066093407b6704B89793beFfD0D8F00';

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Full LSP23 ABI
const LSP23_ABI = [
  "function deployERC1167Proxies(tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata) external payable returns (address primaryContractAddress, address secondaryContractAddress)",
  "function computeERC1167Addresses(tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata) external view returns (address primaryContractAddress, address secondaryContractAddress)",
  "event DeployedERC1167Proxies(address indexed primaryContract, address indexed secondaryContract, tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata)"
];

// UP and KeyManager initialize ABIs
const UP_ABI = ["function initialize(address initialOwner) external"];
const KM_ABI = ["function initialize(address target, address[] calldata controllers, uint256[] calldata permissions) external"];

async function deploy() {
  console.log('🚀 Deploying UP + KeyManager via LSP23...\n');
  
  // Generate a random salt
  const salt = ethers.hexlify(ethers.randomBytes(32));
  console.log('Salt:', salt);
  
  // Encode UP initialization - owner will be the KeyManager (we'll set this after KM is deployed)
  // For now, initialize with controller as owner, then transfer to KM
  const upInterface = new ethers.Interface(UP_ABI);
  const upInitCalldata = upInterface.encodeFunctionData('initialize', [CONTROLLER]);
  console.log('UP init calldata:', upInitCalldata);
  
  // Encode KeyManager initialization
  // The KM needs the UP address, which we don't know yet
  // We use addPrimaryContractAddress = true to append the UP address
  // Then we add the controller + permissions
  const kmInterface = new ethers.Interface(KM_ABI);
  
  // Up to the UP address
  const kmInitCalldata = kmInterface.encodeFunctionData('initialize', [
    ethers.ZeroAddress, // Placeholder - will be replaced with UP address
    [CONTROLLER], // Controller
    [0] // Permissions (0 = default, can be set later)
  ]);
  console.log('KM init calldata:', kmInitCalldata);
  
  // The full KM init will be: kmInitCalldata (without last 64 bytes for address) + UP address + controllers + permissions
  // Actually, let's simplify and use the PostDeploymentModule to set permissions
  
  const factory = new ethers.Contract(LSP23_FACTORY, LSP23_ABI, wallet);
  
  // Primary = UP
  const primaryDeployment = {
    salt: salt,
    fundingAmount: 0,
    implementationContract: UP_IMPLEMENTATION,
    initializationCalldata: upInitCalldata
  };
  
  // Secondary = KeyManager
  const secondaryDeployment = {
    fundingAmount: 0,
    implementationContract: KM_IMPLEMENTATION,
    initializationCalldata: kmInitCalldata,
    addPrimaryContractAddress: true,
    extraInitializationParams: '0x' // Empty - the UP address replaces ZeroAddress
  };
  
  // Compute expected addresses first
  console.log('\n📍 Computing expected addresses...');
  try {
    const [expectedUP, expectedKM] = await factory.computeERC1167Addresses(
      primaryDeployment,
      secondaryDeployment,
      POST_DEPLOY_MODULE,
      '0x'
    );
    console.log('Expected UP:', expectedUP);
    console.log('Expected KeyManager:', expectedKM);
  } catch (err) {
    console.log('Could not compute addresses:', err.message);
  }
  
  // Deploy
  console.log('\n📤 Sending deployment transaction...');
  try {
    const tx = await factory.deployERC1167Proxies(
      primaryDeployment,
      secondaryDeployment,
      POST_DEPLOY_MODULE,
      '0x', // No post-deployment calldata for now
      { gasLimit: 5000000 }
    );
    
    console.log('⏳ Transaction:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Confirmed in block:', receipt.blockNumber);
    
    // Parse events
    const factoryInterface = new ethers.Interface(LSP23_ABI);
    for (const log of receipt.logs) {
      try {
        const parsed = factoryInterface.parseLog(log);
        if (parsed && parsed.name === 'DeployedERC1167Proxies') {
          console.log('\n🎉 Deployment successful!');
          console.log('UP Address:', parsed.args.primaryContract);
          console.log('KeyManager:', parsed.args.secondaryContract);
        }
      } catch (e) {}
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.data) console.error('Data:', err.data);
  }
}

deploy().catch(console.error);
