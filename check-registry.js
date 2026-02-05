const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';
const REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const COLLECTION_UP = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';

async function checkRegistry() {
  console.log('🔍 Checking Collection Registry\n');
  
  // Check if there's an ABI available or if we can call view functions
  const REGISTRY_ABI = [
    'function owner() view returns (address)',
    'function getCollection(address collectionUP) view returns (bool isRegistered, uint256 momentCount, address owner)',
    'function isCollectionRegistered(address collectionUP) view returns (bool)',
    'function getRegisteredCollections() view returns (address[])',
    'function getCollectionsByOwner(address owner) view returns (address[])',
    'event CollectionRegistered(address indexed collectionUP, address indexed owner)',
    'event CollectionCreated(address indexed collectionUP, address indexed owner, bytes metadata)'
  ];
  
  const registry = new ethers.Contract(REGISTRY, REGISTRY_ABI, provider);
  
  try {
    const owner = await registry.owner();
    console.log('Registry Owner:', owner);
    console.log('');
  } catch (e) {
    console.log('No owner() or error:', e.message.slice(0, 50));
    console.log('');
  }
  
  try {
    const isRegistered = await registry.isCollectionRegistered(COLLECTION_UP);
    console.log('Is our collection registered?:', isRegistered);
  } catch (e) {
    console.log('Could not check registration status:', e.message.slice(0, 50));
  }
  
  try {
    const collInfo = await registry.getCollection(COLLECTION_UP);
    console.log('Collection Info:');
    console.log('  Is Registered:', collInfo.isRegistered);
    console.log('  Moment Count:', collInfo.momentCount.toString());
    console.log('  Owner:', collInfo.owner);
  } catch (e) {
    console.log('Could not get collection info:', e.message.slice(0, 100));
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('Checking Factory Authorization');
  console.log('═══════════════════════════════════════════════════');
  
  const FACTORY_ABI = [
    'function owner() view returns (address)',
    'function getCollection(address collectionUP) view returns (bool isRegistered, uint256 momentCount, address owner)',
    'function isAuthorizedMinter(address minter) view returns (bool)',
    'function isCollectionAuthorized(address collectionUP) view returns (bool)'
  ];
  
  const factory = new ethers.Contract(FACTORY, FACTORY_ABI, provider);
  
  try {
    const factoryOwner = await factory.owner();
    console.log('Factory Owner:', factoryOwner);
    console.log('');
    
    const isMinter = await factory.isAuthorizedMinter(UP_ADDRESS).catch(() => null);
    console.log('Is UP authorized minter?:', isMinter);
    
    const isCollAuth = await factory.isCollectionAuthorized(COLLECTION_UP).catch(() => null);
    console.log('Is collection authorized?:', isCollAuth);
    
    const collInfo = await factory.getCollection(COLLECTION_UP).catch(() => null);
    if (collInfo) {
      console.log('Factory Collection Info:');
      console.log('  Is Registered:', collInfo.isRegistered);
      console.log('  Moment Count:', collInfo.momentCount.toString());
      console.log('  Owner:', collInfo.owner);
    }
  } catch (e) {
    console.log('Factory checks error:', e.message.slice(0, 100));
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('Summary:');
  console.log('═══════════════════════════════════════════════════');
  console.log('To mint a moment, the collection must be:');
  console.log('  1. Registered in the Factory or Registry');
  console.log('  2. Owned/controlled by an authorized minter');
  console.log('  OR');
  console.log('  3. The minter must be authorized by factory owner');
  console.log('');
  console.log('Our UP (controller) needs authorization to mint.');
  console.log('Factory Owner:', '0x7dE347bE3EbAED43065182FcABA462796d6f2a83');
  console.log('Registry Owner needs to authorize collection creation.');
}

checkRegistry().catch(console.error);