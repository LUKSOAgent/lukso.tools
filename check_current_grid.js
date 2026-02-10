const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x68b6a8dea50000008fe600000000000000000000000000000000000000000000';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  const data = await up.getData(GRID_KEY);
  
  console.log('Current stored value:');
  console.log('Length:', data.length);
  console.log('First 100 chars:', data.slice(0, 100));
  console.log('');
  
  // Decode to see what it contains
  if (data.length > 66) {
    // First 32 bytes (64 hex chars + 0x) is verification
    const verification = data.slice(0, 66);
    const uriPart = '0x' + data.slice(66);
    
    console.log('Verification (32 bytes):', verification);
    console.log('');
    
    try {
      const decoded = ethers.toUtf8String(uriPart);
      console.log('Decoded URI part:');
      console.log(decoded.slice(0, 100) + '...');
    } catch (e) {
      console.log('Could not decode as UTF8');
    }
  }
}

check();
