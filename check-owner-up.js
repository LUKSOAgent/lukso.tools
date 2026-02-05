const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const COLLECTION = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';

const PERMISSIONS_KEY = '0x4b80742d0000000082ac0000';

async function checkOwnerUP() {
  console.log('🔍 Checking Owner UP Configuration\n');
  console.log('Owner UP:', UP_ADDRESS);
  console.log('KeyManager:', KEY_MANAGER);
  console.log('Controller:', CONTROLLER);
  console.log('Collection:', COLLECTION);
  console.log('');
  
  // Check controller permissions on Owner UP
  const km = new ethers.Contract(KEY_MANAGER, [
    'function getData(bytes32 dataKey) view returns (bytes)',
    'function execute(bytes calldata payload) returns (bytes memory)',
    'function target() view returns (address)',
    'function owner() view returns (address)'
  ], provider);
  
  console.log('═══════════════════════════════════════════════════');
  console.log('KeyManager Info:');
  console.log('═══════════════════════════════════════════════════');
  
  try {
    const target = await km.target();
    console.log('Target (UP):', target);
    console.log('Matches Owner UP:', target.toLowerCase() === UP_ADDRESS.toLowerCase());
  } catch (e) {
    console.log('Could not get target:', e.message.slice(0, 50));
  }
  
  try {
    const owner = await km.owner();
    console.log('KeyManager Owner:', owner);
  } catch (e) {
    console.log('Could not get owner:', e.message.slice(0, 50));
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('Controller Permissions:');
  console.log('═══════════════════════════════════════════════════');
  
  const controllerKey = PERMISSIONS_KEY + CONTROLLER.slice(2).toLowerCase();
  console.log('Checking permissions for:', CONTROLLER);
  
  try {
    const perms = await km.getData(controllerKey);
    console.log('Permissions:', perms);
    
    if (perms.length > 2) {
      const permHex = perms.slice(2).padStart(64, '0');
      const permValue = BigInt('0x' + permHex);
      
      console.log('Permission Value:', '0x' + permHex);
      console.log('Has permissions:', permValue !== BigInt(0));
      
      // Check CALL permission (bit 6)
      const CALL = BigInt(1) << BigInt(6);
      const hasCall = (permValue & CALL) !== BigInt(0);
      console.log('Has CALL permission:', hasCall);
      
      if (hasCall) {
        console.log('');
        console.log('✅ Controller CAN execute transactions through KeyManager');
      } else {
        console.log('');
        console.log('❌ Controller does NOT have CALL permission');
      }
    } else {
      console.log('');
      console.log('❌ No permissions found for controller');
    }
  } catch (e) {
    console.log('Could not get permissions:', e.message);
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('Summary:');
  console.log('═══════════════════════════════════════════════════');
  console.log('To mint a moment, we need:');
  console.log('  1. Controller to have CALL permissions on Owner UP KeyManager');
  console.log('  2. Either:');
  console.log('     a) Collection to be registered in Factory, OR');
  console.log('     b) Mint without collection (address(0)), OR');
  console.log('     c) Factory owner to authorize the Owner UP');
  console.log('');
  console.log('Based on collection-up-configuration-report.json:');
  console.log('  Controller SHOULD have permissions after that configuration');
  console.log('  The permissions were set to: 0x00000000000000000000000000000000000000000000000000000000007fbf3f');
}

checkOwnerUP().catch(console.error);