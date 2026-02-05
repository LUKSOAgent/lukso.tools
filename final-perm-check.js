const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const OLD_CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const NEW_CONTROLLER = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';

const UP_ABI = [
  {
    "inputs": [{ "internalType": "bytes32", "name": "dataKey", "type": "bytes32" }],
    "name": "getData",
    "outputs": [{ "internalType": "bytes", "name": "", "type": "bytes" }],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkBothControllers() {
  console.log('=== Checking Permissions for Both Controllers ===\n');
  
  const up = new ethers.Contract(OWNER_UP, UP_ABI, provider);
  const permissionPrefix = '0x4b80742d0000000082ac0000';
  
  // Check old controller
  const oldKey = permissionPrefix + OLD_CONTROLLER.toLowerCase().slice(2);
  const oldPerms = await up.getData(oldKey);
  
  console.log('Old Controller (0xE093...):');
  console.log('  Address:', OLD_CONTROLLER);
  console.log('  Permissions:', oldPerms);
  console.log('  Has permissions:', oldPerms !== '0x' && oldPerms !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? '✅ YES' : '❌ NO');
  console.log('');
  
  // Check new controller
  const newKey = permissionPrefix + NEW_CONTROLLER.toLowerCase().slice(2);
  const newPerms = await up.getData(newKey);
  
  console.log('New Controller (0x50Fa...):');
  console.log('  Address:', NEW_CONTROLLER);
  console.log('  Permissions:', newPerms);
  console.log('  Has permissions:', newPerms !== '0x' && newPerms !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? '✅ YES' : '❌ NO');
  
  if (newPerms !== '0x' && newPerms !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
    const permBigInt = BigInt(newPerms);
    const ALL_PERMISSIONS = 0x00000000000000000000000000000000000000000000000000000000007f3f7fn;
    const CALL = 0x0000000000000000000000000000000000000000000000000000000000000800n;
    
    console.log('  Has CALL permission:', (permBigInt & CALL) !== 0n ? '✅' : '❌');
    console.log('  Has ALL_PERMISSIONS:', (permBigInt & ALL_PERMISSIONS) === ALL_PERMISSIONS ? '✅' : '❌');
  }
  console.log('');
  
  // Conclusion
  console.log('=== CONCLUSION ===');
  console.log('The private key provided derives to the OLD controller (0xE093...)');
  console.log('The OLD controller NO LONGER HAS PERMISSIONS on the UP');
  console.log('The NEW controller (0x50Fa...) HAS PERMISSIONS on the UP');
  console.log('');
  console.log('To complete the collection creation, you need:');
  console.log('  The private key for the NEW controller:', NEW_CONTROLLER);
  console.log('');
  console.log('Without the correct private key, the transaction will fail');
  console.log('with "Not controller" because the KeyManager rejects calls');
  console.log('from addresses without permissions.');
}

checkBothControllers().catch(console.error);
