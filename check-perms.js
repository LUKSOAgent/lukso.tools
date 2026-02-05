const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

const UP_ABI = ['function getData(bytes32 dataKey) view returns (bytes)'];

async function checkPermissions() {
  console.log('Checking permissions for controller:', CONTROLLER);
  console.log('');
  
  const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
  
  // LSP6 Permissions data key
  // Mapping key: 0x4b80742d0000000082ac0000 (keccak256('LSP6Permissions')[:20])
  // + address (padded to 32 bytes)
  const mappingKey = '0x4b80742d0000000082ac0000'; // 22 bytes
  const addressBytes = CONTROLLER.toLowerCase(); // 42 chars with 0x
  const dataKey = mappingKey + addressBytes.slice(2).padStart(64, '0'); // Total should be 66 chars (0x + 64 hex)
  
  console.log('Mapping key:', mappingKey);
  console.log('Data key:', dataKey);
  console.log('Data key length:', dataKey.length);
  console.log('');
  
  try {
    const permissions = await up.getData(dataKey);
    console.log('Permissions (raw):', permissions);
    
    if (permissions && permissions.length > 2) {
      const permHex = permissions.slice(2).padStart(64, '0');
      const permValue = BigInt('0x' + permHex);
      
      console.log('');
      console.log('Permissions value:', permValue.toString(16));
      
      // LSP6 permission bits
      const ALL_PERMISSIONS = 0xffffffffffffffffffffffffffffffffn;
      const CALL = 1n << 2n;
      const STATICCALL = 1n << 4n;
      const DELEGATECALL = 1n << 5n;
      
      console.log('');
      console.log('Permission checks:');
      console.log('  ALL_PERMISSIONS:', permValue === ALL_PERMISSIONS);
      console.log('  CALL:', (permValue & CALL) !== 0n);
      console.log('  STATICCALL:', (permValue & STATICCALL) !== 0n);
      console.log('  DELEGATECALL:', (permValue & DELEGATECALL) !== 0n);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

checkPermissions().catch(console.error);
