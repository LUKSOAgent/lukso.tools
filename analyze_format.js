const { ethers } = require('ethers');

// From LSP2 spec example
const specExample = '0x00006f357c6a0020820464ddfac1bec070cc14a8daf04129871d458f2ca94368aae8391311af6361696670733a2f2f516d597231564a4c776572673670456f73636468564775676f3339706136727963455a4c6a7452504466573834554178';

console.log('LSP2 Spec Example breakdown:');
console.log('Full:', specExample.slice(0, 80) + '...');
console.log('Length:', specExample.length, 'chars\n');

// Parse
console.log('Byte structure:');
console.log('  0x0000 - Identifier (2 bytes)');
console.log('  6f357c6a - Method keccak256(utf8) (4 bytes)');
console.log('  0020 - Data length 32 (2 bytes)');
console.log('  820464ddfa...af6361 - Hash (32 bytes = 64 hex chars)');
console.log('  69667073... - URL (remaining bytes)\n');

const identifier = specExample.slice(2, 6);
const method = specExample.slice(6, 14);
const lengthHex = specExample.slice(14, 18);
const hash = specExample.slice(18, 82); // 64 chars
const urlHex = specExample.slice(82);

console.log('Parsed from spec:');
console.log('  Identifier:', identifier);
console.log('  Method:', method);
console.log('  Length:', lengthHex, '=', parseInt(lengthHex, 16), 'bytes');
console.log('  Hash:', hash.slice(0, 20) + '...');
console.log('  URL (decoded):', ethers.toUtf8String('0x' + urlHex));
console.log('\n' + '='.repeat(60) + '\n');

// My current data
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function checkMine() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  const data = await up.getData(GRID_KEY);
  
  console.log('My current data breakdown:');
  console.log('First 120 chars:', data.slice(0, 120));
  console.log('Length:', data.length, 'chars\n');
  
  const myId = data.slice(2, 6);
  const myMethod = data.slice(6, 14);
  const myLengthHex = data.slice(14, 18);
  const myHash = data.slice(18, 82);
  const myUrlHex = data.slice(82);
  
  console.log('Parsed from my data:');
  console.log('  Identifier:', myId);
  console.log('  Method:', myMethod);
  console.log('  Length:', myLengthHex, '=', parseInt(myLengthHex, 16), 'bytes');
  console.log('  Hash:', myHash.slice(0, 20) + '...');
  console.log('  URL starts (decoded):', ethers.toUtf8String('0x' + myUrlHex).slice(0, 60));
  
  console.log('\n' + '='.repeat(60));
  console.log('\nDIFFERENCES:');
  console.log('  Spec length field: 0020 (32 bytes for hash)');
  console.log('  My length field:', myLengthHex, '(' + parseInt(myLengthHex, 16) + ' bytes)');
  console.log('');
  console.log('  The issue: My length field should be 0020 (hash length),');
  console.log('  but I have 0419 which is the URL length!');
}

checkMine();
