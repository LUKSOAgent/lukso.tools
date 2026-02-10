const { ethers } = require('ethers');

// Test controller (has 0.5 LYX)
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_6';
const CONTROLLER = '0xf4dF36124d5D1bBEc1EE55CA20F70905E0f59e2b';

// LSP23 Factory (mainnet)
const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';

// Implementation addresses
const UP_IMPLEMENTATION = '0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F'; // v0.14.0
const KM_IMPLEMENTATION = '0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4'; // v0.14.0
const POST_DEPLOY_MODULE = '0x000000000066093407b6704B89793beFfD0D8F00';

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Minimal LSP23 ABI
const LSP23_ABI = [
  "function deployUniversalProfile(address universalProfileImplementation, address keyManagerImplementation, bytes calldata upInitData, bytes calldata kmInitData, address postDeploymentModule, bytes calldata postDeploymentData) external returns (address upProxy, address kmProxy)"
];

async function deployViaLSP23() {
  console.log('🚀 Deploying UP via LSP23 Factory...\n');
  console.log('Controller:', CONTROLLER);
  console.log('Factory:', LSP23_FACTORY);
  
  const balance = await provider.getBalance(CONTROLLER);
  console.log('Balance:', ethers.formatEther(balance), 'LYX\n');
  
  const factory = new ethers.Contract(LSP23_FACTORY, LSP23_ABI, wallet);
  
  // UP init data - empty for now
  const upInitData = '0x';
  
  // KM init data - set the controller as the owner with permissions
  // LSP6 init: set the controller as the single owner
  const kmInitData = '0x';
  
  // Post deployment data - give controller full permissions
  const postDeployData = '0x';
  
  console.log('Sending deployment transaction...');
  
  try {
    const tx = await factory.deployUniversalProfile(
      UP_IMPLEMENTATION,
      KM_IMPLEMENTATION,
      upInitData,
      kmInitData,
      POST_DEPLOY_MODULE,
      postDeployData,
      { gasLimit: 5000000 }
    );
    
    console.log('⏳ Transaction:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Confirmed in block:', receipt.blockNumber);
    
    // Parse logs for deployed addresses
    console.log('\nParsing deployment events...');
    
    for (const log of receipt.logs) {
      console.log('Log address:', log.address);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.data) console.error('Data:', err.data);
  }
}

deployViaLSP23().catch(console.error);
