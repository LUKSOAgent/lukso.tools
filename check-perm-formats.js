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

async function checkPermissions() {
  console.log('=== Checking Permissions with Different Key Formats ===\n');
  
  const up = new ethers.Contract(OWNER_UP, UP_ABI, provider);
  
  // Different possible key formats for LSP6 permissions
  const formats = [
    { name: 'Standard LSP6', prefix: '0x4b80742d0000000082ac0000' },
    { name: 'Alternative 1', prefix: '0x4b80742d0000000082ac' },
    { name: 'Alternative 2', prefix: '0x4b80742d' },
    { name: 'Raw keccak256', prefix: '0x' }
  ];
  
  for (const addr of [OLD_CONTROLLER, NEW_CONTROLLER]) {
    console.log(`Address: ${addr}`);
    console.log('-'.repeat(60));
    
    for (const format of formats) {
      let key;
      if (format.name === 'Raw keccak256') {
        key = ethers.keccak256(ethers.toUtf8Bytes(`LSP6Permissions:${addr}`));
      } else {
        key = format.prefix + addr.toLowerCase().slice(2).padStart(24, '0').slice(-24);
      }
      
      try {
        const perms = await up.getData(key);
        if (perms !== '0x') {
          console.log(`  ${format.name}: ✅ HAS DATA`);
          console.log(`    Key: ${key}`);
          console.log(`    Value: ${perms}`);
        }
      } catch (e) {
        // ignore
      }
    }
    console.log('');
  }
  
  // Also check for ALL controllers by querying the permission key without address
  console.log('=== Checking for any permission data ===');
  const permPrefix = '0x4b80742d';
  console.log('Looking for any data keys starting with', permPrefix);
}

checkPermissions().catch(console.error);
