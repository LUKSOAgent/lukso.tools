const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

// Let's check the Collection Registry to understand the architecture
const REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const COLLECTION_UP = '0x538399D10E3c791Aa5dC822672C0E89cE4AD63ca'; // From the mint event
const TARGET = '0x4f95606AA863ba1FDfd4E14d6050BDe4fA38B058'; // From tx

// Collection ABI
const COLLECTION_ABI = [
  'function mintMoment(bytes memory metadataURI) returns (bytes32)',
  'function mintMoment(address recipient, bytes memory metadataURI) returns (bytes32)',
  'function getCollectionUP() view returns (address)',
  'function owner() view returns (address)',
  'function getFactory() view returns (address)',
  'function getMomentsCount() view returns (uint256)',
  'function getMomentByIndex(uint256 index) view returns (address momentAddress, bytes32 tokenId)'
];

async function checkCollectionContract() {
  console.log('🔍 Checking if Target is a Collection Contract\n');
  
  const collection = new ethers.Contract(TARGET, COLLECTION_ABI, provider);
  
  try {
    // Try to get factory
    const factory = await collection.getFactory();
    console.log('Factory:', factory);
    console.log('Matches our factory:', factory.toLowerCase() === '0xEF54710b5A78B4926104a65594539521EB440D37'.toLowerCase());
    console.log('');
  } catch (e) {
    console.log('No getFactory() function');
  }
  
  try {
    const momentsCount = await collection.getMomentsCount();
    console.log('Moments Count:', momentsCount.toString());
  } catch (e) {
    console.log('No getMomentsCount() function');
  }
  
  try {
    const collectionUP = await collection.getCollectionUP();
    console.log('Collection UP:', collectionUP);
  } catch (e) {
    console.log('No getCollectionUP() function');
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('Checking Collection UP from mint event:');
  console.log('═══════════════════════════════════════════════════');
  console.log('Collection UP:', COLLECTION_UP);
  
  // Check if Collection UP is a UP
  const UP_ABI = [
    'function owner() view returns (address)',
    'function getData(bytes32 dataKey) view returns (bytes)',
    'function supportsInterface(bytes4 interfaceId) view returns (bool)'
  ];
  
  const up = new ethers.Contract(COLLECTION_UP, UP_ABI, provider);
  
  try {
    const owner = await up.owner();
    console.log('Collection UP Owner:', owner);
  } catch (e) {
    console.log('Not a UP or no owner');
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('Hypothesis:');
  console.log('═══════════════════════════════════════════════════');
  console.log('The target contract (0x4f9560...) might be:');
  console.log('  1. A collection-specific minting contract');
  console.log('  2. The LSP8 collection contract itself');
  console.log('  3. A helper/adapter contract');
  console.log('');
  console.log('To mint, users might need to:');
  console.log('  - Call through the collection contract');
  console.log('  - Or use a registered collection helper');
  console.log('  - Or the factory must authorize the UP as a minter');
}

checkCollectionContract().catch(console.error);