const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  const data = await up.getData(GRID_KEY);
  
  console.log('Current LSP28TheGrid value:');
  console.log('First 20 chars:', data.slice(0, 20));
  console.log('Length:', data.length);
  console.log('');
  console.log('Status:', data.startsWith('0x0000000000000000') ? 'WRONG (too many zeros)' : 
                          data.startsWith('0x0000') ? 'CORRECT (0x0000 prefix)' : 'UNKNOWN');
}

check();
