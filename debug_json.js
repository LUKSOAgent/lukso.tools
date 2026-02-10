const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function debug() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  const data = await up.getData(GRID_KEY);
  
  console.log('=== DECODING STORED DATA ===\n');
  
  // Parse VerifiableURI
  const hexData = data.slice(2);
  const identifier = hexData.slice(0, 4);
  const method = hexData.slice(4, 12);
  const length = hexData.slice(12, 16);
  const hash = hexData.slice(16, 80);
  const urlHex = '0x' + hexData.slice(80);
  
  console.log('Structure:');
  console.log('  Identifier:', identifier);
  console.log('  Method:', method);
  console.log('  Length:', length);
  console.log('  Hash:', hash);
  
  // Decode URL
  const url = ethers.toUtf8String(urlHex);
  console.log('\nURL:', url.slice(0, 80) + '...');
  
  // Extract and decode JSON
  const base64Part = url.replace('data:application/json;base64,', '');
  const jsonString = Buffer.from(base64Part, 'base64').toString('utf8');
  
  console.log('\n=== FULL DECODED JSON ===');
  console.log(jsonString);
  
  console.log('\n=== PARSED JSON ===');
  const json = JSON.parse(jsonString);
  console.log(JSON.stringify(json, null, 2));
  
  // Check expected structure
  console.log('\n=== VALIDATION ===');
  if (json.LSP28TheGrid) {
    console.log('✅ Has LSP28TheGrid property');
    console.log('  Array length:', json.LSP28TheGrid.length);
    
    json.LSP28TheGrid.forEach((cell, i) => {
      console.log(`\n  Cell ${i}:`);
      console.log(`    title: ${cell.title}`);
      console.log(`    creatorName: ${cell.creatorName}`);
      console.log(`    link: ${cell.link || '(empty)'}`);
      console.log(`    color: ${cell.color}`);
    });
  } else {
    console.log('❌ Missing LSP28TheGrid property');
  }
}

debug();
