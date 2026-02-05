const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

const UP_ABI = [
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const LSP6_ABI = [
  {
    "inputs": [],
    "name": "target",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkState() {
  console.log('=== Checking UP and KeyManager State ===\n');
  
  const up = new ethers.Contract(OWNER_UP, UP_ABI, provider);
  const km = new ethers.Contract(KEY_MANAGER, LSP6_ABI, provider);
  
  try {
    const upOwner = await up.owner();
    console.log('UP Owner:', upOwner);
    console.log('Expected KeyManager:', KEY_MANAGER);
    console.log('Owner is KeyManager:', upOwner.toLowerCase() === KEY_MANAGER.toLowerCase() ? '✅ YES' : '❌ NO');
    console.log('');
  } catch (e) {
    console.log('Error getting UP owner:', e.message);
  }
  
  try {
    const target = await km.target();
    console.log('KeyManager target:', target);
    console.log('Target is UP:', target.toLowerCase() === OWNER_UP.toLowerCase() ? '✅ YES' : '❌ NO');
  } catch (e) {
    console.log('Error getting KeyManager target:', e.message);
  }
  
  console.log('');
  console.log('=== Checking KeyManager Code ===');
  const code = await provider.getCode(KEY_MANAGER);
  console.log('KeyManager has code:', code.length > 2 ? `✅ YES (${code.length} bytes)` : '❌ NO');
  
  console.log('');
  console.log('=== Checking UP Code ===');
  const upCode = await provider.getCode(OWNER_UP);
  console.log('UP has code:', upCode.length > 2 ? `✅ YES (${upCode.length} bytes)` : '❌ NO');
}

checkState().catch(console.error);
