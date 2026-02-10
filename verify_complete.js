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
  
  // Parse VerifiableURI
  const identifier = data.slice(2, 6);
  const method = data.slice(6, 14);
  const hash = data.slice(14, 78);
  const lengthHex = data.slice(78, 82);
  const length = parseInt(lengthHex, 16);
  
  console.log('Structure:');
  console.log('  Identifier (0000):', identifier);
  console.log('  Method (6f357c6a):', method);
  console.log('  Hash:', hash);
  console.log('  Length:', lengthHex, '=', length, 'chars');
  console.log('');
  
  // Extract URL
  const urlHex = '0x' + data.slice(82);
  const url = ethers.toUtf8String(urlHex);
  console.log('Data URL:', url.slice(0, 70) + '...');
  console.log('');
  
  // Decode JSON
  const base64 = url.replace('data:application/json;base64,', '');
  const jsonString = Buffer.from(base64, 'base64').toString('utf8');
  const json = JSON.parse(jsonString);
  
  console.log('Grid cells:', json.LSP28TheGrid.length);
  json.LSP28TheGrid.forEach((cell, i) => {
    console.log(`  ${i}: ${cell.title} (${cell.creatorName})`);
  });
  
  console.log('\nView: https://erc725-inspect.lukso.tech/inspector?address=0x293E96ebbf264ed7715cff2b67850517De70232a&network=lukso+mainnet');
}

verify();
