const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';

const UP_ABI = [
  'function owner() view returns (address)',
  'function getData(bytes32 dataKey) view returns (bytes)',
  'function getDataBatch(bytes32[] dataKeys) view returns (bytes[])'
];

// LSP6 KeyManager data key
const LSP6KEYMANAGER_KEY = '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5';

async function findKeyManager() {
  console.log('Finding Key Manager for UP:', UP_ADDRESS);
  console.log('');
  
  const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
  
  // Method 1: Get owner
  try {
    const owner = await up.owner();
    console.log('Owner:', owner);
    
    // Check if owner is a contract
    const code = await provider.getCode(owner);
    console.log('Owner has code:', code !== '0x');
    console.log('Code length:', code.length);
    
    if (code !== '0x') {
      console.log('✓ Owner is a contract (likely KeyManager)');
    }
  } catch (e) {
    console.log('Error getting owner:', e.message);
  }
  
  console.log('');
  
  // Method 2: Get LSP6KeyManager data key
  try {
    const data = await up.getData(LSP6KEYMANAGER_KEY);
    console.log('LSP6KeyManager data:', data);
    
    if (data && data.length >= 42) {
      const keyManager = '0x' + data.slice(-40);
      console.log('Key Manager from data key:', keyManager);
    }
  } catch (e) {
    console.log('Error getting data:', e.message);
  }
}

findKeyManager().catch(console.error);
