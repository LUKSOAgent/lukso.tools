const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  const data = await up.getData(GRID_KEY);
  
  console.log('=== FINAL LSP28 GRID ===\n');
  console.log('Data starts with:', data.slice(0, 60));
  
  // Decode
  const hexData = data.slice(2);
  const hash = '0x' + hexData.slice(16, 80);
  const urlHex = '0x' + hexData.slice(80);
  const url = ethers.toUtf8String(urlHex);
  const base64 = url.replace('data:application/json;base64,', '');
  const jsonString = Buffer.from(base64, 'base64').toString('utf8');
  const json = JSON.parse(jsonString);
  
  console.log('\nHash:', hash);
  console.log('\nGrid:');
  console.log('  Title:', json.LSP28TheGrid[0].title);
  console.log('  Columns:', json.LSP28TheGrid[0].gridColumns);
  console.log('  Visibility:', json.LSP28TheGrid[0].visibility);
  console.log('  Cells:', json.LSP28TheGrid[0].grid.length);
  
  // Verify hash
  const calcHash = ethers.keccak256(ethers.toUtf8Bytes(jsonString));
  console.log('\nHash match:', hash.toLowerCase() === calcHash.toLowerCase() ? '✅' : '❌');
  
  console.log('\nTX: 0x7214140c703a21d4bea049e8040e7423c7f4930d10b726a48581780b27f4073f');
}

check();
