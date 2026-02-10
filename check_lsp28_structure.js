const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

// LSP28 might use indexed keys for cells
// LSP28TheGrid[0], LSP28TheGrid[1], etc.

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  console.log('Checking for LSP28 indexed cell keys...\n');
  
  // Check if there are individual cell keys
  for (let i = 0; i < 9; i++) {
    const key = ethers.keccak256(ethers.toUtf8Bytes(`LSP28TheGrid[${i}]`));
    const data = await up.getData(key);
    if (data.length > 2) {
      console.log(`LSP28TheGrid[${i}]: HAS DATA`);
    }
  }
  
  // Also check the array length key
  const arrayKey = ethers.keccak256(ethers.toUtf8Bytes('LSP28TheGrid[]'));
  const arrayData = await up.getData(arrayKey);
  console.log('\nLSP28TheGrid[] (array length):', arrayData.length > 2 ? arrayData : 'empty');
}

check();
