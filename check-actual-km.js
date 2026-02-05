const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const COLLECTION_UP = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';
const ACTUAL_KM = '0x41b4c4667b99aa73dc6321d8c883f139e7ed6f1f';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

const KM_ABI = [
  'function target() view returns (address)',
  'function owner() view returns (address)',
  'function getData(bytes32 dataKey) view returns (bytes)',
  'function execute(bytes calldata payload) returns (bytes memory)'
];

const PERMISSIONS_KEY = '0x4b80742d0000000082ac0000';

async function checkActualKM() {
  console.log('🔍 Checking Actual KeyManager\n');
  console.log('KeyManager:', ACTUAL_KM);
  console.log('Collection UP:', COLLECTION_UP);
  console.log('Controller:', CONTROLLER);
  console.log('');
  
  const km = new ethers.Contract(ACTUAL_KM, KM_ABI, provider);
  
  try {
    const target = await km.target();
    console.log('KeyManager Target:', target);
    console.log('Matches Collection UP:', target.toLowerCase() === COLLECTION_UP.toLowerCase());
    console.log('');
  } catch (e) {
    console.log('Could not get target:', e.message);
  }
  
  try {
    const owner = await km.owner();
    console.log('KeyManager Owner:', owner);
    console.log('Is Collection UP:', owner.toLowerCase() === COLLECTION_UP.toLowerCase());
    console.log('');
  } catch (e) {
    console.log('Could not get owner:', e.message);
  }
  
  // Check controller permissions
  const controllerKey = PERMISSIONS_KEY + CONTROLLER.slice(2).toLowerCase();
  console.log('Checking controller permissions...');
  console.log('Data key:', controllerKey);
  
  try {
    const perms = await km.getData(controllerKey);
    console.log('Permissions:', perms);
    console.log('Has permissions:', perms !== '0x' && perms.length > 2);
    
    if (perms.length > 2) {
      // Decode permissions
      console.log('');
      console.log('Permission bits:');
      const permHex = perms.slice(2).padStart(64, '0');
      console.log('  Full:', '0x' + permHex);
      
      // Common permissions
      const permValue = BigInt('0x' + permHex);
      console.log('  Value:', permValue.toString());
      
      // Check specific permissions
      const CHANGEOWNER = BigInt(1) << BigInt(0);
      const ADDPERMISSIONS = BigInt(1) << BigInt(1);
      const CHANGEPERMISSIONS = BigInt(1) << BigInt(2);
      const ADDEXTENSIONS = BigInt(1) << BigInt(3);
      const CHANGEEXTENSIONS = BigInt(1) << BigInt(4);
      const CALL = BigInt(1) << BigInt(6);
      const STATICCALL = BigInt(1) << BigInt(7);
      const DELEGATECALL = BigInt(1) << BigInt(8);
      const DEPLOY = BigInt(1) << BigInt(9);
      const TRANSFERVALUE = BigInt(1) << BigInt(10);
      const SIGN = BigInt(1) << BigInt(11);
      
      console.log('');
      console.log('Has CHANGEOWNER:', (permValue & CHANGEOWNER) !== BigInt(0));
      console.log('Has ADDPERMISSIONS:', (permValue & ADDPERMISSIONS) !== BigInt(0));
      console.log('Has CHANGEPERMISSIONS:', (permValue & CHANGEPERMISSIONS) !== BigInt(0));
      console.log('Has CALL:', (permValue & CALL) !== BigInt(0));
      console.log('Has TRANSFERVALUE:', (permValue & TRANSFERVALUE) !== BigInt(0));
      console.log('Has SIGN:', (permValue & SIGN) !== BigInt(0));
    }
    console.log('');
  } catch (e) {
    console.log('Could not get permissions:', e.message);
  }
}

checkActualKM().catch(console.error);