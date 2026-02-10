const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function decode() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  const data = await up.getData(GRID_KEY);
  
  console.log('=== CURRENT ON-CHAIN DATA ===\n');
  console.log('Raw data (first 200 chars):');
  console.log(data.slice(0, 200));
  console.log('\nFull length:', data.length, 'chars\n');
  
  // Parse according to LSP2 VerifiableURI
  // 0x0000 + method(4) + hash(32) + length(2) + url
  const identifier = data.slice(0, 6); // 0x0000
  const method = data.slice(6, 14); // 6f357c6a
  const hash = data.slice(14, 78); // 32 bytes = 64 hex chars
  const lengthHex = data.slice(78, 82); // 2 bytes = 4 hex chars
  const urlHex = data.slice(82);
  
  console.log('Parsed:');
  console.log('  Identifier:', identifier);
  console.log('  Method:', method);
  console.log('  Hash:', hash);
  console.log('  Length (hex):', lengthHex);
  console.log('  Length (decimal):', parseInt(lengthHex, 16));
  console.log('');
  
  // Decode URL
  const url = ethers.toUtf8String('0x' + urlHex);
  console.log('Decoded URL:');
  console.log(url.slice(0, 100));
  console.log('');
  
  // Check if it's data URI format
  if (url.startsWith('data:application/json;base64,')) {
    console.log('✅ URL starts with "data:application/json;base64,"');
    const base64Part = url.replace('data:application/json;base64,', '');
    console.log('Base64 length:', base64Part.length);
    
    // Decode base64
    const jsonString = Buffer.from(base64Part, 'base64').toString('utf8');
    console.log('\nDecoded JSON (first 200 chars):');
    console.log(jsonString.slice(0, 200));
    
    // Calculate hash of JSON
    const calculatedHash = ethers.keccak256(ethers.toUtf8Bytes(jsonString));
    console.log('\nCalculated hash of decoded JSON:');
    console.log(calculatedHash);
    
    console.log('\nStored hash:');
    console.log('0x' + hash);
    
    console.log('\nMatch:', calculatedHash.toLowerCase() === ('0x' + hash).toLowerCase());
  } else {
    console.log('❌ URL does NOT start with expected prefix');
    console.log('Actual start:', url.slice(0, 50));
  }
}

decode();
