const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

// Addresses
const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const WALLET_ADDRESS = '0xE093A714960da1bF297522617BfC08132b62B86a';  // Derived from private key
const CREDENTIALS_CONTROLLER = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';  // From credentials

// LSP6 Key Manager ABI (for checking permissions)
const LSP6_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "caller", "type": "address" }],
    "name": "getPermissions",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "target",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// LSP0 ERC725Account ABI
const LSP0_ABI = [
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkPermissions() {
  console.log('=== Checking UP Permissions ===\n');
  
  const up = new ethers.Contract(OWNER_UP, LSP0_ABI, provider);
  
  // Get the owner (should be the KeyManager)
  const owner = await up.owner();
  console.log('Owner UP:', OWNER_UP);
  console.log('Owner (KeyManager):', owner);
  console.log('');
  
  // Check if owner is a KeyManager
  const keyManager = new ethers.Contract(owner, LSP6_ABI, provider);
  const target = await keyManager.target();
  console.log('KeyManager target:', target);
  console.log('Target matches UP:', target.toLowerCase() === OWNER_UP.toLowerCase() ? '✅ YES' : '❌ No');
  console.log('');
  
  // Check permissions for both addresses
  console.log('Checking permissions...\n');
  
  const addresses = [
    { name: 'Wallet (derived from PK)', address: WALLET_ADDRESS },
    { name: 'Credentials Controller', address: CREDENTIALS_CONTROLLER }
  ];
  
  for (const { name, address } of addresses) {
    try {
      const permissions = await keyManager.getPermissions(address);
      console.log(`${name}:`);
      console.log(`  Address: ${address}`);
      console.log(`  Permissions: ${permissions}`);
      console.log(`  Has permissions: ${permissions !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? '✅ YES' : '❌ No'}`);
      
      // Decode common permissions
      const CALL_PERMISSION = '0x0000000000000000000000000000000000000000000000000000000000000800';
      const SUPER_CALL = '0x0000000000000000000000000000000000000000000000000000000000000020';
      
      const permBigInt = BigInt(permissions);
      const hasCall = (permBigInt & BigInt(CALL_PERMISSION)) !== BigInt(0);
      const hasSuperCall = (permBigInt & BigInt(SUPER_CALL)) !== BigInt(0);
      
      console.log(`  Has CALL permission: ${hasCall ? '✅' : '❌'}`);
      console.log(`  Has SUPER_CALL: ${hasSuperCall ? '✅' : '❌'}`);
      console.log('');
    } catch (e) {
      console.log(`${name}:`);
      console.log(`  Address: ${address}`);
      console.log(`  Error checking permissions: ${e.message}`);
      console.log('');
    }
  }
  
  // Try to find addresses with permissions by checking some common ones
  console.log('=== Checking for addresses with permissions ===\n');
  
  const addressesToCheck = [
    '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5',
    '0xE093A714960da1bF297522617BfC08132b62B86a',
    '0x293E96ebbf264ed7715cff2b67850517De70232a'  // The UP itself
  ];
  
  for (const addr of addressesToCheck) {
    try {
      const perms = await keyManager.getPermissions(addr);
      if (perms !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.log(`Address with permissions: ${addr}`);
        console.log(`  Permissions: ${perms}`);
      }
    } catch (e) {
      // ignore
    }
  }
}

checkPermissions().catch(console.error);
