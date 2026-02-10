const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_6';
const CONTROLLER = '0xf4dF36124d5D1bBEc1EE55CA20F70905E0f59e2b';
const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
const UP_IMPLEMENTATION = '0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F';
const KM_IMPLEMENTATION = '0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4';
const POST_DEPLOY_MODULE = '0x000000000066093407b6704B89793beFfD0D8F00';

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const LSP23_ABI = [
  "function deployERC1167Proxies(tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata) external payable returns (address primaryContractAddress, address secondaryContractAddress)",
  "event DeployedERC1167Proxies(address indexed primaryContract, address indexed secondaryContract, tuple(bytes32 salt, uint256 fundingAmount, address implementationContract, bytes initializationCalldata) primaryContractDeploymentInit, tuple(uint256 fundingAmount, address implementationContract, bytes initializationCalldata, bool addPrimaryContractAddress, bytes extraInitializationParams) secondaryContractDeploymentInit, address postDeploymentModule, bytes postDeploymentModuleCalldata)"
];

// Correct ABIs
const UP_ABI = ["function initialize(address initialOwner) external payable"];
const KM_ABI = ["function initialize(address target_) external"]; // Only 1 param!

async function deploy() {
  console.log('🚀 Deploying with correct ABIs...\n');
  
  const salt = ethers.hexlify(ethers.randomBytes(32));
  console.log('Salt:', salt);
  
  // UP initialization - owner will be the controller initially
  const upInterface = new ethers.Interface(UP_ABI);
  const upInitCalldata = upInterface.encodeFunctionData('initialize', [CONTROLLER]);
  console.log('UP init calldata:', upInitCalldata);
  
  // KeyManager initialization - ONLY target address, nothing else!
  // The UP address will be appended by the factory (addPrimaryContractAddress = true)
  const kmInterface = new ethers.Interface(KM_ABI);
  const kmInitCalldata = kmInterface.encodeFunctionData('initialize', [ethers.ZeroAddress]);
  console.log('KM init calldata:', kmInitCalldata);
  
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
  
  console.log('\n📤 Sending deployment...');
  
  try {
    const tx = await factory.deployERC1167Proxies(
      primaryDeployment,
      secondaryDeployment,
      POST_DEPLOY_MODULE,
      '0x',
      { gasLimit: 5000000 }
    );
    
    console.log('⏳ Transaction:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Parse event
    const factoryInterface = new ethers.Interface(LSP23_ABI);
    for (const log of receipt.logs) {
      try {
        const parsed = factoryInterface.parseLog(log);
        if (parsed?.name === 'DeployedERC1167Proxies') {
          console.log('\n🎉 SUCCESS!');
          console.log('UP Address:', parsed.args.primaryContract);
          console.log('KeyManager:', parsed.args.secondaryContract);
          
          // Save to file
          const fs = require('fs');
          fs.writeFileSync('/root/.openclaw/workspace/new-up-address.json', JSON.stringify({
            up: parsed.args.primaryContract,
            keyManager: parsed.args.secondaryContract,
            controller: CONTROLLER,
            tx: tx.hash
          }, null, 2));
          console.log('\nSaved to new-up-address.json');
        }
      } catch (e) {}
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

deploy().catch(console.error);
