const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';
const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const COLLECTION_ADDRESS = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';

// Extended ABI to check all functions
const FACTORY_ABI = [
  'function owner() view returns (address)',
  'function LIKES_TOKEN() view returns (address)',
  'function getMomentsCount() view returns (uint256)',
  'function getImplementation() view returns (address)',
  'function mintMoment(address recipient, bytes memory metadataURI, address collectionUP) returns (bytes32)',
  'function mintMoment(address recipient, bytes memory metadataURI) returns (bytes32)',
  'function getCollection(address collectionUP) view returns (bool isRegistered, uint256 momentCount, address owner)',
  'function getMomentByIndex(uint256 index) view returns (address momentAddress, address collectionUP, bytes32 tokenId)',
  'function isAuthorizedMinter(address minter) view returns (bool)'
];

const REGISTRY_ABI = [
  'function getCollection(address collectionUP) view returns (bool isRegistered, uint256 momentCount, address owner)',
  'function isCollectionRegistered(address collectionUP) view returns (bool)',
  'function owner() view returns (address)'
];

async function analyzeFactory() {
  console.log('🔍 Analyzing Forever Moments Contracts\n');
  
  const factory = new ethers.Contract(FACTORY, FACTORY_ABI, provider);
  const registry = new ethers.Contract(COLLECTION_REGISTRY, REGISTRY_ABI, provider);
  
  try {
    // Factory info
    const owner = await factory.owner();
    const likesToken = await factory.LIKES_TOKEN();
    const momentsCount = await factory.getMomentsCount();
    const implementation = await factory.getImplementation();
    
    console.log('═══════════════════════════════════════════════════');
    console.log('Factory Info:');
    console.log('═══════════════════════════════════════════════════');
    console.log('  Address:', FACTORY);
    console.log('  Owner:', owner);
    console.log('  LIKES Token:', likesToken);
    console.log('  Moments Count:', momentsCount.toString());
    console.log('  Implementation:', implementation);
    console.log('');
    
    // Check authorization
    const isUPAuthorized = await factory.isAuthorizedMinter(UP_ADDRESS).catch(() => null);
    console.log('Authorization Check:');
    console.log('  UP Address:', UP_ADDRESS);
    console.log('  Is UP authorized minter?:', isUPAuthorized);
    console.log('  Is UP the owner?:', UP_ADDRESS.toLowerCase() === owner.toLowerCase());
    console.log('');
    
    // Collection status in factory
    console.log('═══════════════════════════════════════════════════');
    console.log('Collection Status:');
    console.log('═══════════════════════════════════════════════════');
    console.log('  Collection Address:', COLLECTION_ADDRESS);
    
    const collectionInFactory = await factory.getCollection(COLLECTION_ADDRESS).catch(e => {
      console.log('  Factory getCollection error:', e.message.slice(0, 100));
      return null;
    });
    
    if (collectionInFactory) {
      console.log('  Is Registered in Factory:', collectionInFactory.isRegistered);
      console.log('  Moment Count:', collectionInFactory.momentCount.toString());
      console.log('  Owner:', collectionInFactory.owner);
    }
    console.log('');
    
    // Collection registry status
    const isRegisteredInRegistry = await registry.isCollectionRegistered(COLLECTION_ADDRESS).catch(() => null);
    console.log('  Is Registered in Registry:', isRegisteredInRegistry);
    
    const registryInfo = await registry.getCollection(COLLECTION_ADDRESS).catch(() => null);
    if (registryInfo) {
      console.log('  Registry - Is Registered:', registryInfo.isRegistered);
      console.log('  Registry - Moment Count:', registryInfo.momentCount.toString());
      console.log('  Registry - Owner:', registryInfo.owner);
    }
    console.log('');
    
    // Recent moments
    if (momentsCount > 0) {
      console.log('═══════════════════════════════════════════════════');
      console.log('Recent Moments:');
      console.log('═══════════════════════════════════════════════════');
      
      const count = Number(momentsCount);
      const start = Math.max(0, count - 5);
      
      for (let i = count - 1; i >= start; i--) {
        try {
          const moment = await factory.getMomentByIndex(i);
          console.log(`  [${i}] Address: ${moment.momentAddress}`);
          console.log(`      Collection: ${moment.collectionUP}`);
          console.log(`      Token ID: ${moment.tokenId}`);
          console.log('');
        } catch (e) {
          console.log(`  [${i}] Error reading moment:`, e.message.slice(0, 50));
        }
      }
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('Requirements for mintMoment:');
    console.log('═══════════════════════════════════════════════════');
    console.log('  - Caller must be authorized minter OR factory owner');
    console.log('  - Collection must be registered (if using collectionUP param)');
    console.log('  - MetadataURI must be valid bytes');
    console.log('');
    
    if (!isUPAuthorized && UP_ADDRESS.toLowerCase() !== owner.toLowerCase()) {
      console.log('⚠️  The UP is NOT authorized to mint moments!');
      console.log('');
      console.log('Possible solutions:');
      console.log('  1. Use Forever Moments UI at https://forever-moments.io');
      console.log('  2. Factory owner must add UP as authorized minter');
      console.log('  3. Check if collection needs separate registration first');
      console.log('');
      console.log('Factory Owner:', owner);
      console.log('Authorized Minters: Check contract directly');
    }
    
  } catch (e) {
    console.log('Error:', e.message);
  }
}

analyzeFactory();