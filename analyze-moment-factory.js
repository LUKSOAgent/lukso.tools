const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';

const FACTORY_ABI = [
  'function owner() view returns (address)',
  'function LIKES_TOKEN() view returns (address)',
  'function getMomentsCount() view returns (uint256)',
  'function getImplementation() view returns (address)',
  'function mintMoment(address recipient, bytes memory metadataURI, address collectionUP) returns (bytes32)'
];

async function analyzeFactory() {
  console.log('🔍 Analyzing Forever Moments Factory\n');
  
  const factory = new ethers.Contract(FACTORY, FACTORY_ABI, provider);
  
  try {
    const owner = await factory.owner();
    const likesToken = await factory.LIKES_TOKEN();
    const momentsCount = await factory.getMomentsCount();
    const implementation = await factory.getImplementation();
    
    console.log('Factory Info:');
    console.log('  Owner:', owner);
    console.log('  LIKES Token:', likesToken);
    console.log('  Moments Count:', momentsCount.toString());
    console.log('  Implementation:', implementation);
    console.log('');
    
    // Check if UP is authorized
    console.log('Checking UP permissions...');
    console.log('  UP Address:', UP_ADDRESS);
    console.log('  Factory Owner:', owner);
    console.log('  Is UP the owner?', UP_ADDRESS.toLowerCase() === owner.toLowerCase() ? '✅ YES' : '❌ No');
    console.log('');
    
    console.log('📋 Requirements for mintMoment:');
    console.log('  - Caller must be authorized');
    console.log('  - MetadataURI must be valid bytes');
    console.log('  - CollectionUP can be address(0)');
    console.log('');
    
    if (UP_ADDRESS.toLowerCase() !== owner.toLowerCase()) {
      console.log('⚠️  The UP is NOT the factory owner!');
      console.log('  Only the owner can mint moments directly.');
      console.log('');
      console.log('Solutions:');
      console.log('  1. Use the Forever Moments UI with UP connect');
      console.log('  2. The factory owner must authorize the UP');
      console.log('  3. There might be a different minting function');
    }
    
  } catch (e) {
    console.log('Error:', e.message);
  }
}

analyzeFactory();