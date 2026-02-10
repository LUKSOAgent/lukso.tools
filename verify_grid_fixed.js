const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x68b6a8dea50000008fe600000000000000000000000000000000000000000000';

async function verify() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  console.log('Verifying grid data...\n');
  
  try {
    const data = await up.getData(GRID_KEY);
    console.log('Stored value starts with:', data.slice(0, 40));
    console.log('Full value length:', data.length, 'chars');
    
    // Check if it starts correctly (should be 0x0000...)
    if (data.startsWith('0x0000')) {
      console.log('✅ Correct format - starts with 0x0000...');
    } else {
      console.log('❌ Wrong format - starts with:', data.slice(0, 10));
    }
    
    // Try to extract and decode
    if (data.length > 66) {
      // Skip first 32 bytes (verification) and decode the rest
      const uriHex = '0x' + data.slice(66);
      try {
        const uri = ethers.toUtf8String(uriHex);
        console.log('\nDecoded URI:', uri.slice(0, 80) + '...');
      } catch (e) {
        console.log('\nCould not decode URI:', e.message);
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

verify();
