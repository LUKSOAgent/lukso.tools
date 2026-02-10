const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

// Possible LSP28 keys
const KEYS = {
  LSP28TheGrid: '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff',
  // Other possible keys
  LSP28Grid: ethers.keccak256(ethers.toUtf8Bytes('LSP28Grid')),
  LSP28Cells: ethers.keccak256(ethers.toUtf8Bytes('LSP28Cells[]')),
};

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  console.log('Checking all possible LSP28 keys:\n');
  
  for (const [name, key] of Object.entries(KEYS)) {
    const data = await up.getData(key);
    console.log(`${name} (${key.slice(0, 20)}...):`);
    console.log(`  Has data: ${data.length > 2 ? 'YES' : 'NO'}`);
    if (data.length > 2) {
      console.log(`  First 40 chars: ${data.slice(0, 40)}`);
    }
    console.log('');
  }
}

check();
