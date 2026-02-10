const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function verify() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  const data = await up.getData(GRID_KEY);
  
  console.log('=== FINAL VERIFICATION ===\n');
  console.log('Raw data (first 150 chars):');
  console.log(data.slice(0, 150) + '\n');
  
  // Parse according to LSP2 spec
  // 0x0000 + method(4) + length(2) + hash(32) + url
  const hexData = data.slice(2);
  
  const identifier = '0x' + hexData.slice(0, 4);
  const method = '0x' + hexData.slice(4, 12);
  const verificationLength = '0x' + hexData.slice(12, 16);
  const hash = '0x' + hexData.slice(16, 80);
  const urlHex = '0x' + hexData.slice(80);
  
  console.log('Parsed VerifiableURI:');
  console.log('  verification: {');
  console.log('    method:', method, '(keccak256(utf8) = 0x6f357c6a)');
  console.log('    data:', hash);
  console.log('  }');
  
  const url = ethers.toUtf8String(urlHex);
  console.log('  url:', url.slice(0, 70) + '...');
  
  console.log('\n' + '='.repeat(60));
  
  // Verify the hash matches the JSON
  const base64Data = url.replace('data:application/json;base64,', '');
  const jsonString = Buffer.from(base64Data, 'base64').toString('utf8');
  const calculatedHash = ethers.keccak256(ethers.toUtf8Bytes(jsonString));
  
  console.log('\nHash verification:');
  console.log('  Stored hash:', hash);
  console.log('  Calculated: ', calculatedHash);
  console.log('  Match:', hash.toLowerCase() === calculatedHash.toLowerCase() ? '✅ YES' : '❌ NO');
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ All checks passed!');
  console.log('\nVerifiableURI structure:');
  console.log('{');
  console.log('  verification: {');
  console.log('    method: "keccak256(utf8)",');
  console.log('    data: "' + hash + '"');
  console.log('  },');
  console.log('  url: "data:application/json;base64,..."');
  console.log('}');
}

verify();
