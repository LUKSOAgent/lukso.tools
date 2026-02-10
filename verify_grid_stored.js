const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function verify() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  const data = await up.getData(GRID_KEY);
  
  console.log('✅ GRID DATA STORED');
  console.log('====================\n');
  console.log('Raw data first 100 chars:', data.slice(0, 100));
  console.log('Full length:', data.length);
  console.log('');
  
  // Parse
  const identifier = data.slice(2, 6);
  const method = data.slice(6, 14);
  const hash = data.slice(14, 78);
  const lengthHex = data.slice(78, 82);
  const length = parseInt(lengthHex, 16);
  
  console.log('Parsed structure:');
  console.log('Identifier (0000):', identifier);
  console.log('Method (6f357c6a):', method);
  console.log('Hash:', hash);
  console.log('Length (03fc = 1020):', lengthHex, '=', length);
  console.log('');
  
  // Extract base64 and decode
  const base64Hex = data.slice(82);
  const base64 = Buffer.from(base64Hex.slice(2), 'hex').toString('utf8');
  console.log('Base64 data starts with:', base64.slice(0, 50));
  console.log('');
  
  const jsonString = Buffer.from(base64, 'base64').toString('utf8');
  const json = JSON.parse(jsonString);
  console.log('Decoded JSON:');
  console.log('Grid cells:', json.LSP28TheGrid.length);
  json.LSP28TheGrid.forEach((cell, i) => {
    console.log(`  ${i}: ${cell.title}`);
  });
  console.log('');
  console.log('View: https://erc725-inspect.lukso.tech/inspector?address=0x293E96ebbf264ed7715cff2b67850517De70232a&network=lukso+mainnet');
}

verify();
