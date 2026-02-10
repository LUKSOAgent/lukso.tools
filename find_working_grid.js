const { ethers } = require('ethers');

// Jean's UP - using lowercase to avoid checksum issues
const JEAN_UP = '0xccfa83c5bb8f661fdbc5f158e95bdb638a8a4e69';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(JEAN_UP, upAbi, provider);
  
  const data = await up.getData(GRID_KEY);
  
  console.log("Jean's LSP28TheGrid data:");
  console.log('Has data:', data.length > 2 ? 'YES' : 'NO');
  
  if (data.length > 2) {
    console.log('\nFirst 200 chars:');
    console.log(data.slice(0, 200));
    console.log('\nFull length:', data.length);
    
    // Parse
    const identifier = data.slice(0, 6);
    const method = data.slice(6, 14);
    const hash = data.slice(14, 78);
    const lengthHex = data.slice(78, 82);
    const urlHex = data.slice(82);
    
    console.log('\nParsed:');
    console.log('  Identifier:', identifier);
    console.log('  Method:', method);
    console.log('  Hash:', hash);
    console.log('  Length:', parseInt(lengthHex, 16));
    
    // Decode URL
    const url = ethers.toUtf8String('0x' + urlHex);
    console.log('\n  URL starts with:', url.slice(0, 60));
  }
}

check();
