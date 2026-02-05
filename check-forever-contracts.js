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
const CONTROLLER_ADDRESS = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';
const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';

// Common ABIs - we'll test these
const REGISTRY_ABI = [
  // Standard registry functions
  'function registerCollection(address collectionUP, string memory name, string memory symbol, bytes memory metadata) returns (bool)',
  'function createCollection(bytes memory metadata) returns (address)',
  'function registerCollection(address collectionUP, bytes memory metadata) returns (bool)',
  'function getCollection(address collectionUP) view returns (tuple(address up, bytes metadata, uint256 createdAt, address creator))',
  'function collections(address) view returns (address up, bytes metadata, uint256 createdAt, address creator)',
  'event CollectionRegistered(address indexed collectionUP, address indexed creator, uint256 timestamp)',
  'event CollectionCreated(address indexed collectionUP, address indexed creator, bytes32 collectionId)',
  
  // LSP0/UP interface
  'function owner() view returns (address)',
  'function getData(bytes32 dataKey) view returns (bytes)',
  
  // Testing
  'function supportsInterface(bytes4 interfaceId) view returns (bool)'
];

const FACTORY_ABI = [
  'function mintMoment(address recipient, bytes memory metadataURI, address collectionUP) returns (bytes32)',
  'function mintMoment(address recipient, bytes memory metadataURI) returns (bytes32)',
  'function moments(bytes32) view returns (address creator, uint256 timestamp, bytes metadata)',
  'function getMoment(bytes32 momentId) view returns (tuple(address creator, uint256 timestamp, bytes metadata))',
  'event MomentMinted(address indexed creator, bytes32 indexed momentId, address indexed collectionUP)',
  'event MomentMinted(address indexed creator, bytes32 indexed momentId)',
  
  // Collection-related
  'function collectionRegistry() view returns (address)',
  'function getCollectionRegistry() view returns (address)'
];

async function checkContracts() {
  console.log('🔍 Checking Forever Moments Contracts\n');
  console.log('UP Address:', UP_ADDRESS);
  console.log('Controller:', CONTROLLER_ADDRESS);
  console.log('');
  
  const registry = new ethers.Contract(COLLECTION_REGISTRY, REGISTRY_ABI, provider);
  const factory = new ethers.Contract(MOMENT_FACTORY, FACTORY_ABI, provider);
  
  // Check balances
  const balance = await provider.getBalance(CONTROLLER_ADDRESS);
  console.log('Controller Balance:', ethers.formatEther(balance), 'LYX');
  console.log('');
  
  // Try to read factory info
  try {
    console.log('📦 Moment Factory:', MOMENT_FACTORY);
    
    // Check if factory has collection registry
    try {
      const regAddr = await factory.collectionRegistry();
      console.log('  Collection Registry:', regAddr);
    } catch (e) {
      console.log('  collectionRegistry() not available');
    }
    
    try {
      const regAddr = await factory.getCollectionRegistry();
      console.log('  getCollectionRegistry():', regAddr);
    } catch (e) {
      console.log('  getCollectionRegistry() not available');
    }
    
    // Check if factory supports interface
    try {
      const supports = await factory.supportsInterface('0x7f583c9e'); // LSP0
      console.log('  Supports LSP0:', supports);
    } catch (e) {
      console.log('  supportsInterface not available');
    }
  } catch (e) {
    console.log('Error checking factory:', e.message);
  }
  
  console.log('');
  
  // Check registry
  try {
    console.log('📚 Collection Registry:', COLLECTION_REGISTRY);
    
    // Try to get owner
    try {
      const owner = await registry.owner();
      console.log('  Owner:', owner);
    } catch (e) {
      console.log('  owner() not available');
    }
    
    // Try supportsInterface
    try {
      const supports = await registry.supportsInterface('0x7f583c9e');
      console.log('  Supports LSP0:', supports);
    } catch (e) {
      console.log('  supportsInterface not available');
    }
  } catch (e) {
    console.log('Error checking registry:', e.message);
  }
  
  console.log('');
  console.log('✅ Contract check complete');
}

checkContracts().catch(err => {
  console.error('❌ Error:', err.message);
});