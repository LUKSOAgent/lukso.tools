const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x68b6a8dea50000008fe600000000000000000000000000000000000000000000';

async function debug() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  const data = await up.getData(GRID_KEY);
  
  console.log('Current LSP28TheGrid value:');
  console.log('Raw data:', data);
  console.log('Length:', data.length);
  console.log('First 100 chars:', data.slice(0, 100));
  console.log('');
  
  // Check transaction receipts
  const TX1 = '0x060071f9a4f6d2a0557d98712ba802813781282a5abe7a7d12eabaa4f7d63f4b';
  const TX2 = '0x08ada6fcb943dc98aec46e28807c22ad68a3103e8291f70576a4a6e8cdd91478';
  
  console.log('Checking recent transactions:');
  const r1 = await provider.getTransactionReceipt(TX1);
  const r2 = await provider.getTransactionReceipt(TX2);
  
  console.log('TX1:', r1?.status === 1 ? '✅ Success' : '❌ Failed/Not found');
  console.log('TX2:', r2?.status === 1 ? '✅ Success' : '❌ Failed/Not found');
}

debug();
