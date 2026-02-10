const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';
const LAST_TX = '0x4ba3cb5b0e09c734120416cffa060516153a0f5b64a659fd1b180d1c511eb1ca';

async function debug() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  console.log('=== DEBUGGING GRID STATE ===\n');
  
  // Check transaction
  const receipt = await provider.getTransactionReceipt(LAST_TX);
  console.log('Last transaction:', LAST_TX);
  console.log('Status:', receipt?.status === 1 ? 'SUCCESS' : 'FAILED');
  console.log('Block:', receipt?.blockNumber);
  console.log('');
  
  // Get current data
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  const data = await up.getData(GRID_KEY);
  
  console.log('Current data at LSP28TheGrid key:');
  console.log('First 120 chars:', data.slice(0, 120));
  console.log('Total length:', data.length);
  console.log('');
  
  // Check if it's the old format or new format
  if (data.startsWith('0x0000000000000000')) {
    console.log('❌ OLD FORMAT (0x0000000000000000...)');
  } else if (data.startsWith('0x00006f357c6a')) {
    console.log('✅ NEW FORMAT (0x00006f357c6a...)');
  } else if (data.startsWith('0x0000')) {
    console.log('⚠️  PARTIAL FORMAT (0x0000...)');
  } else {
    console.log('❓ UNKNOWN FORMAT');
  }
}

debug();
