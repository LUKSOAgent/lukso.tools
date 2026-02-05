const { ethers } = require('ethers');
const fs = require('fs');

// Setup provider and wallet
const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

// Addresses
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';

// Extended ABIs
const REGISTRY_ABI = [
  'function owner() view returns (address)',
  'function collectionRegistry() view returns (address)',
  'function registerCollection(address collectionUP, bytes memory metadata)',
  'function createCollection(bytes memory metadata) returns (address)',
  'function getCollectionCount() view returns (uint256)',
  'function getCollections(uint256 start, uint256 limit) view returns (address[])',
  'function collections(uint256) view returns (address)',
  'function isRegistered(address) view returns (bool)',
  'function getCollectionData(address) view returns (bytes memory)',
  'event CollectionRegistered(address indexed collectionUP, address indexed creator, bytes metadata)',
  'event CollectionCreated(address indexed collectionUP, address indexed creator)'
];

const FACTORY_ABI = [
  'function collectionRegistry() view returns (address)',
  'function mintMoment(address recipient, bytes memory metadataURI, address collectionUP) returns (bytes32)',
  'function mintMoment(address recipient, bytes memory metadataURI) returns (bytes32)',
  'function mintToCollection(address recipient, bytes memory metadataURI, address collectionUP) returns (bytes32)',
  'function getMomentCount() view returns (uint256)',
  'function getMoments(uint256 start, uint256 limit) view returns (bytes32[])',
  'function getMoment(bytes32 momentId) view returns (address creator, uint256 timestamp, bytes memory metadata)',
  'function getMomentMetadata(bytes32 momentId) view returns (bytes memory)',
  'event MomentMinted(address indexed creator, bytes32 indexed momentId, address indexed collectionUP, bytes metadata)',
  'event MomentMinted(address indexed creator, bytes32 indexed momentId, address collectionUP)',
  'event MomentMinted(address indexed creator, bytes32 indexed momentId)'
];

async function exploreContracts() {
  console.log('🔍 Exploring Forever Moments Contracts\n');
  
  const registry = new ethers.Contract(COLLECTION_REGISTRY, REGISTRY_ABI, provider);
  const factory = new ethers.Contract(MOMENT_FACTORY, FACTORY_ABI, provider);
  
  // Try various registry functions
  console.log('📚 Collection Registry Functions:');
  
  const registryFuncs = [
    'getCollectionCount',
    'isRegistered',
    'getCollectionData'
  ];
  
  for (const func of registryFuncs) {
    try {
      if (func === 'isRegistered') {
        const result = await registry[func](UP_ADDRESS);
        console.log(`  ${func}(UP_ADDRESS):`, result);
      } else if (func === 'getCollectionData') {
        const result = await registry[func](UP_ADDRESS);
        console.log(`  ${func}(UP_ADDRESS):`, result);
      } else {
        const result = await registry[func]();
        console.log(`  ${func}():`, result.toString());
      }
    } catch (e) {
      console.log(`  ${func}: Not available (${e.message.slice(0, 50)}...)`);
    }
  }
  
  console.log('');
  console.log('📦 Moment Factory Functions:');
  
  const factoryFuncs = [
    'getMomentCount',
    'collectionRegistry'
  ];
  
  for (const func of factoryFuncs) {
    try {
      const result = await factory[func]();
      console.log(`  ${func}():`, result.toString());
    } catch (e) {
      console.log(`  ${func}: Not available (${e.message.slice(0, 50)}...)`);
    }
  }
  
  // Look at past events to understand the ABI
  console.log('');
  console.log('🔎 Checking recent events...');
  
  try {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 10000;
    
    // Look for CollectionRegistered events
    const filter = {
      address: COLLECTION_REGISTRY,
      fromBlock: fromBlock,
      toBlock: 'latest',
      topics: []
    };
    
    const logs = await provider.getLogs(filter);
    console.log(`  Found ${logs.length} logs from registry in last 10000 blocks`);
    
    if (logs.length > 0) {
      console.log('  Sample log topics:', logs[0].topics.slice(0, 3));
    }
  } catch (e) {
    console.log('  Error fetching logs:', e.message);
  }
  
  console.log('');
  console.log('✅ Exploration complete');
}

exploreContracts().catch(err => {
  console.error('❌ Error:', err.message);
});