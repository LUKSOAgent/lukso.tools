const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const WALLET_ADDRESS = '0xE093A714960da1bF297522617BfC08132b62B86a';

// LSP6 Key Manager ABI with the correct function signature
const LSP6_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "addressToCheck", "type": "address" }],
    "name": "getPermissions",
    "outputs": [{ "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "dataKey", "type": "bytes32" }],
    "name": "getData",
    "outputs": [{ "internalType": "bytes", "name": "", "type": "bytes" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// LSP0 UP ABI for reading storage directly
const UP_ABI = [
  {
    "inputs": [{ "internalType": "bytes32", "name": "dataKey", "type": "bytes32" }],
    "name": "getData",
    "outputs": [{ "internalType": "bytes", "name": "", "type": "bytes" }],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkPermissions() {
  console.log('=== Checking Permissions via Storage ===\n');
  
  // LSP6 permission data key prefix
  // 0x4b80742d0000000082ac0000 + address (without 0x)
  const permissionPrefix = '0x4b80742d0000000082ac0000';
  const dataKey = permissionPrefix + WALLET_ADDRESS.toLowerCase().slice(2);
  
  console.log('Permission Data Key:', dataKey);
  console.log('');
  
  // Check permissions directly from UP storage
  const up = new ethers.Contract(OWNER_UP, UP_ABI, provider);
  
  try {
    const permissions = await up.getData(dataKey);
    console.log('Permissions from UP storage:', permissions);
    
    if (permissions === '0x') {
      console.log('No permissions found (empty)');
    } else {
      console.log('Has permissions: ✅');
      
      // Decode
      const permBigInt = BigInt(permissions);
      const ALL_PERMISSIONS = 0x00000000000000000000000000000000000000000000000000000000007f3f7fn;
      const CALL = 0x0000000000000000000000000000000000000000000000000000000000000800n;
      const SUPER_CALL = 0x0000000000000000000000000000000000000000000000000000000000000020n;
      
      console.log('Has ALL_PERMISSIONS:', (permBigInt & ALL_PERMISSIONS) === ALL_PERMISSIONS ? '✅' : '❌');
      console.log('Has CALL:', (permBigInt & CALL) !== 0n ? '✅' : '❌');
      console.log('Has SUPER_CALL:', (permBigInt & SUPER_CALL) !== 0n ? '✅' : '❌');
    }
  } catch (e) {
    console.log('Error reading permissions:', e.message);
  }
  
  console.log('');
  console.log('=== Checking Key Manager ===\n');
  
  const km = new ethers.Contract(KEY_MANAGER, LSP6_ABI, provider);
  
  try {
    const perms = await km.getPermissions(dataKey);
    console.log('Permissions from KeyManager:', perms);
  } catch (e) {
    console.log('Error from KeyManager:', e.message);
  }
  
  // Try with the address directly
  try {
    // Different ABI format
    const simpleABI = ['function getPermissions(address) view returns (bytes)'];
    const simpleKM = new ethers.Contract(KEY_MANAGER, simpleABI, provider);
    const perms2 = await simpleKM.getPermissions(WALLET_ADDRESS);
    console.log('Permissions (simple ABI):', perms2);
  } catch (e) {
    console.log('Error (simple ABI):', e.message);
  }
}

checkPermissions().catch(console.error);
