const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const COLLECTION_UP = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';
const COLLECTION_KM = '0x3B0492fF46B7A4Dc48Aeb2Eb0595a11FD530d125';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const OWNER_KM = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

const KM_ABI = [
  'function getData(bytes32 dataKey) view returns (bytes)',
  'function getDataBatch(bytes32[] dataKeys) view returns (bytes[])',
  'function getPermissions(address controller) view returns (bytes)',
  'function getControllers() view returns (address[])',
  'function owner() view returns (address)',
  'function target() view returns (address)'
];

const PERMISSIONS_KEY = '0x4b80742d0000000082ac0000'; // prefix for controller permissions

async function checkCollectionPermissions() {
  console.log('🔍 Checking Collection KeyManager Permissions\n');
  
  const km = new ethers.Contract(COLLECTION_KM, KM_ABI, provider);
  
  console.log('Collection KeyManager:', COLLECTION_KM);
  console.log('Collection UP:', COLLECTION_UP);
  console.log('');
  
  try {
    const target = await km.target();
    console.log('KeyManager Target (UP):', target);
    console.log('Matches Collection UP:', target.toLowerCase() === COLLECTION_UP.toLowerCase());
    console.log('');
  } catch (e) {
    console.log('Could not get target:', e.message);
  }
  
  try {
    const owner = await km.owner();
    console.log('KeyManager Owner:', owner);
    console.log('Is Collection UP the owner?:', owner.toLowerCase() === COLLECTION_UP.toLowerCase());
    console.log('');
  } catch (e) {
    console.log('Could not get owner:', e.message);
  }
  
  // Check if our controller has permissions on the collection KM
  const controllerKey = PERMISSIONS_KEY + CONTROLLER.slice(2).toLowerCase();
  console.log('Checking permissions for controller:', CONTROLLER);
  console.log('Data key:', controllerKey);
  console.log('');
  
  try {
    const perms = await km.getData(controllerKey);
    console.log('Controller Permissions:', perms);
    console.log('Has permissions:', perms !== '0x' && perms.length > 2);
    console.log('');
  } catch (e) {
    console.log('Could not get permissions:', e.message);
  }
  
  // Check Owner UP controller permissions
  const ownerControllerKey = PERMISSIONS_KEY + UP_ADDRESS.slice(2).toLowerCase();
  console.log('Checking permissions for Owner UP:', UP_ADDRESS);
  console.log('Data key:', ownerControllerKey);
  console.log('');
  
  try {
    const ownerPerms = await km.getData(ownerControllerKey);
    console.log('Owner UP Permissions:', ownerPerms);
    console.log('Has permissions:', ownerPerms !== '0x' && ownerPerms.length > 2);
    console.log('');
  } catch (e) {
    console.log('Could not get owner permissions:', e.message);
  }
  
  // Check if Owner UP's KeyManager is the controller
  const kmControllerKey = PERMISSIONS_KEY + OWNER_KM.slice(2).toLowerCase();
  console.log('Checking permissions for Owner KM:', OWNER_KM);
  console.log('Data key:', kmControllerKey);
  console.log('');
  
  try {
    const kmPerms = await km.getData(kmControllerKey);
    console.log('Owner KM Permissions:', kmPerms);
    console.log('Has permissions:', kmPerms !== '0x' && kmPerms.length > 2);
    console.log('');
  } catch (e) {
    console.log('Could not get KM permissions:', e.message);
  }
  
  console.log('═══════════════════════════════════════════════════');
  console.log('Summary:');
  console.log('═══════════════════════════════════════════════════');
  console.log('The Collection has its own KeyManager at:', COLLECTION_KM);
  console.log('We need permissions on it to execute transactions as the Collection UP');
  console.log('');
  console.log('If we have permissions, we could:');
  console.log('  1. Call Factory.mintMoment() as the Collection UP');
  console.log('  2. The Factory would see the Collection UP as the caller');
  console.log('  3. If Collection is registered, minting would succeed');
}

checkCollectionPermissions().catch(console.error);