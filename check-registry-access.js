const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.mainnet.lukso.network';
const provider = new ethers.JsonRpcProvider(RPC_URL);

const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const DEPLOYER = '0xE093A714960da1bF297522617BfC08132b62B86a';

// Try different function signatures to understand the contract
const testABIs = [
  'function addController(address) external',
  'function isController(address) view returns (bool)',
  'function controllers(address) view returns (bool)',
  'function allowedControllers(address) view returns (bool)',
  'function authorizedControllers(address) view returns (bool)'
];

async function check() {
  console.log('Checking CollectionRegistry access control...\n');
  
  // Try each ABI to see which functions exist
  for (const abiItem of testABIs) {
    try {
      const contract = new ethers.Contract(COLLECTION_REGISTRY, [abiItem], provider);
      if (abiItem.includes('view returns (bool)')) {
        const result = await contract[abiItem.split('(')[0]](DEPLOYER);
        console.log(`${abiItem}: ${result}`);
      } else {
        console.log(`${abiItem}: function exists (can't call without tx)`);
      }
    } catch (e) {
      if (e.message.includes('function does not exist')) {
        console.log(`${abiItem}: function does not exist`);
      } else {
        console.log(`${abiItem}: error - ${e.reason || e.message.split('\n')[0]}`);
      }
    }
  }
  
  // Check if the registry requires the call to come from the ownerUP itself
  // Maybe it needs to be called via the UP's execute function
  console.log('\nChecking if CollectionRegistry expects calls from UPs directly...');
}

check().catch(console.error);
