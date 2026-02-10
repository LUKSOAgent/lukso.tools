const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

// Permission keys for LSP6
const ADDRESS_PERMISSIONS_PREFIX = '0x4b80742d0000000082ac0000'; // keccak256('AddressPermissions') with padding

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  // Get the permission data key for my controller
  // Format: AddressPermissions:Permissions:<address>
  const addressHash = ethers.keccak256(ethers.toUtf8Bytes('AddressPermissions'));
  const permissionsPrefix = '0x4b80742d0000000082ac0000'; // First 20 bytes of hash
  const controllerBytes = CONTROLLER.slice(2).toLowerCase();
  const permissionKey = permissionsPrefix + controllerBytes;
  
  console.log('Controller:', CONTROLLER);
  console.log('Permission key:', permissionKey);
  
  // Read directly from KeyManager storage
  const keyManagerAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const keyManager = new ethers.Contract(KEY_MANAGER, keyManagerAbi, provider);
  
  try {
    const perms = await keyManager.getData(permissionKey);
    console.log('Permissions:', perms);
    
    // Decode permissions
    // LSP6 permissions are a bytes32 bitmask
    if (perms && perms.length >= 66) {
      const permValue = BigInt(perms);
      console.log('Permission value:', permValue.toString(16));
      
      // Check SETDATA permission (bit 2)
      const SETDATA = BigInt(1) << BigInt(2);
      const EXECUTE = BigInt(1) << BigInt(0);
      
      console.log('Has SETDATA:', (permValue & SETDATA) !== BigInt(0));
      console.log('Has EXECUTE:', (permValue & EXECUTE) !== BigInt(0));
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

check();
