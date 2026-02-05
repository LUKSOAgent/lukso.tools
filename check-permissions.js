const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

// Addresses
const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';  // From previous output
const WALLET_ADDRESS = '0xE093A714960da1bF297522617BfC08132b62B86a';
const CREDENTIALS_CONTROLLER = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';

// LSP6 Key Manager ABI (for checking permissions)
const LSP6_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "addressToCheck", "type": "address" }],
    "name": "getPermissions",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getData",
    "outputs": [{ "internalType": "bytes", "name": "", "type": "bytes" }],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkPermissions() {
  console.log('=== Checking UP Permissions ===\n');
  
  console.log('Owner UP:', OWNER_UP);
  console.log('KeyManager:', KEY_MANAGER);
  console.log('');
  
  const keyManager = new ethers.Contract(KEY_MANAGER, LSP6_ABI, provider);
  
  // Check permissions for both addresses
  const addresses = [
    { name: 'Wallet (derived from PK)', address: WALLET_ADDRESS },
    { name: 'Credentials Controller', address: CREDENTIALS_CONTROLLER }
  ];
  
  for (const { name, address } of addresses) {
    try {
      const permissions = await keyManager.getPermissions(address);
      console.log(`${name}:`);
      console.log(`  Address: ${address}`);
      console.log(`  Permissions hex: ${permissions}`);
      
      const hasNoPermissions = permissions === '0x0000000000000000000000000000000000000000000000000000000000000000';
      console.log(`  Has permissions: ${!hasNoPermissions ? '✅ YES' : '❌ NO'}`);
      
      if (!hasNoPermissions) {
        // Decode permissions
        const permBigInt = BigInt(permissions);
        
        // LSP6 permission bits
        const SUPER_CALL = 0x0000000000000000000000000000000000000000000000000000000000000020n;
        const CALL = 0x0000000000000000000000000000000000000000000000000000000000000800n;
        const ALL_PERMISSIONS = 0x00000000000000000000000000000000000000000000000000000000007f3f7fn;
        
        console.log(`  Has CALL: ${(permBigInt & CALL) !== 0n ? '✅' : '❌'}`);
        console.log(`  Has SUPER_CALL: ${(permBigInt & SUPER_CALL) !== 0n ? '✅' : '❌'}`);
        console.log(`  Has ALL_PERMISSIONS: ${(permBigInt & ALL_PERMISSIONS) === ALL_PERMISSIONS ? '✅' : '❌'}`);
      }
      console.log('');
    } catch (e) {
      console.log(`${name}:`);
      console.log(`  Address: ${address}`);
      console.log(`  Error: ${e.message}`);
      console.log('');
    }
  }
}

checkPermissions().catch(console.error);
