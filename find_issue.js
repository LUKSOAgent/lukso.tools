const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function analyze() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  const data = await up.getData(GRID_KEY);
  
  console.log('FULL ANALYSIS OF MY DATA');
  console.log('========================\n');
  console.log('Raw data:');
  console.log(data);
  console.log('\nLength:', data.length, '\n');
  
  // Remove 0x and analyze
  const hexData = data.slice(2);
  console.log('Hex data (no 0x prefix):');
  console.log(hexData.slice(0, 100) + '...\n');
  
  // Position breakdown
  console.log('Position breakdown:');
  console.log('  Bytes 0-1:   ' + hexData.slice(0, 4) + ' (identifier)');
  console.log('  Bytes 2-5:   ' + hexData.slice(4, 12) + ' (method)');
  console.log('  Bytes 6-7:   ' + hexData.slice(12, 16) + ' (length field??)');
  console.log('  Bytes 8-39:  ' + hexData.slice(16, 80) + ' (hash??)');
  console.log('  Bytes 40+:   ' + hexData.slice(80, 100) + '... (URL??)');
  
  console.log('\nBut according to LSP2 spec:');
  console.log('  Bytes 0-1:   identifier (0000)');
  console.log('  Bytes 2-5:   method (6f357c6a)');  
  console.log('  Bytes 6-7:   verification data length');
  console.log('  Bytes 8-39:  verification data (hash)');
  console.log('  Bytes 40+:   encoded URL');
  
  // So my current structure might be:
  // 0000 - identifier
  // 6f357c6a - method
  // 57e4 - length field?? NO that's wrong! 
  
  console.log('\n\nWait, let me check if my hash starts at the right position...');
  console.log('Expected hash: 57e4d898fed9633d3a34eb7951e45803d8b9e4710f8a4c9c7ff5abf3507681b1');
  console.log('At position 16:', hexData.slice(16, 80));
  
  if (hexData.slice(16, 80) === '57e4d898fed9633d3a34eb7951e45803d8b9e4710f8a4c9c7ff5abf3507681b1') {
    console.log('\n✅ Hash is at correct position!');
    console.log('So the length field at position 12-15 is:', hexData.slice(12, 16));
    console.log('This should be 0020 (32 bytes)');
    
    if (hexData.slice(12, 16) === '0020') {
      console.log('✅ Length field is correct!');
    } else {
      console.log('❌ Length field is WRONG!');
      console.log('  Current:', hexData.slice(12, 16));
      console.log('  Should be: 0020');
    }
  }
}

analyze();
