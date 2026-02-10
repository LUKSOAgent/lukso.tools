const { ethers } = require('ethers');

const UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const ERC725Y_ABI = [
  "function getData(bytes32 dataKey) external view returns (bytes)",
  "function getDataBatch(bytes32[] calldata dataKeys) external view returns (bytes[] memory)"
];

// LSP28 The Grid data key prefix
const LSP28_PREFIX = '0x0a23';

async function checkGrid() {
  const up = new ethers.Contract(UP, ERC725Y_ABI, provider);
  
  // Check if there's any LSP28 data
  // The key should be 0x0a23000000000000000000000000000000000000000000000000000000000000
  const gridKey = '0x0a23000000000000000000000000000000000000000000000000000000000000';
  
  console.log('🔍 Checking LSP28 Grid data...');
  console.log('UP:', UP);
  console.log('Data Key:', gridKey);
  
  try {
    const data = await up.getData(gridKey);
    console.log('\n📊 Raw Data:', data);
    console.log('📊 Data Length:', data.length);
    
    if (data && data !== '0x') {
      // Try to decode
      const hexData = data.slice(2); // Remove 0x
      
      // Check if it's a VerifiableURI (starts with 0x0000 for verification method)
      if (hexData.startsWith('0000')) {
        console.log('\n✅ Detected VerifiableURI format');
        
        // Extract URL length (offset 66-70)
        const urlLengthHex = '0x' + hexData.slice(64, 68);
        const urlLength = parseInt(urlLengthHex, 16);
        console.log('URL Length:', urlLength);
        
        // Extract URL (offset 68 onwards)
        const urlHex = hexData.slice(68, 68 + urlLength * 2);
        const url = Buffer.from(urlHex, 'hex').toString('utf8');
        console.log('\n🔗 URL:', url.substring(0, 200));
        
        // Check if data URL contains swap link
        if (url.includes('universalswaps')) {
          console.log('\n✅ Grid contains Universal Swaps link!');
        } else {
          console.log('\n⚠️ Grid does NOT contain Universal Swaps link yet');
        }
      } else {
        console.log('\n⚠️ Not in VerifiableURI format, trying direct decode...');
        const decoded = Buffer.from(hexData, 'hex').toString('utf8');
        console.log('Decoded:', decoded.substring(0, 200));
      }
    } else {
      console.log('\n❌ No data found at this key');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkGrid();
