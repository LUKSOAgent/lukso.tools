const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function verify() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  const data = await up.getData(GRID_KEY);
  
  console.log('=== FINAL GRID VERIFICATION ===\n');
  console.log('Data starts with:', data.slice(0, 60));
  console.log('');
  
  // Parse
  const hexData = data.slice(2);
  const method = hexData.slice(4, 12);
  const hash = '0x' + hexData.slice(16, 80);
  const urlHex = '0x' + hexData.slice(80);
  const url = ethers.toUtf8String(urlHex);
  
  console.log('VerifiableURI:');
  console.log('  verification: {');
  console.log('    method: "keccak256(bytes)",');
  console.log('    data: "' + hash + '"');
  console.log('  }');
  console.log('  url: "' + url.slice(0, 70) + '..."');
  console.log('');
  
  // Decode JSON
  const base64 = url.replace('data:application/json;base64,', '');
  const jsonString = Buffer.from(base64, 'base64').toString('utf8');
  const json = JSON.parse(jsonString);
  
  console.log('✅ JSON structure:');
  console.log('  LSP28TheGrid: [');
  json.LSP28TheGrid.forEach((cell, i) => {
    console.log(`    { title: "${cell.title}", creatorName: "${cell.creatorName}" },`);
  });
  console.log('  ]');
  
  // Verify hash
  const calculatedHash = ethers.keccak256(ethers.toUtf8Bytes(jsonString));
  console.log('\nHash verification:', hash.toLowerCase() === calculatedHash.toLowerCase() ? '✅ MATCH' : '❌ MISMATCH');
  
  console.log('\nTransaction: 0x4f349f0885d2ae15a1186a8fcf267dd44fda60a1079a26ac0c035d9438cf1a33');
}

verify();
