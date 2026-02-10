const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  console.log('Trying different permission key formats...\n');
  
  // Format 1: Standard LSP6
  const key1 = '0x4b80742d0000000082ac0000' + CONTROLLER.slice(2).toLowerCase();
  console.log('Format 1 (LSP6):', key1);
  try {
    const p1 = await up.getData(key1);
    console.log('Result:', p1, '\n');
  } catch (e) {
    console.log('Error:', e.message, '\n');
  }
  
  // Format 2: Maybe uppercase?
  const key2 = '0x4B80742D0000000082AC0000' + CONTROLLER.slice(2).toUpperCase();
  console.log('Format 2 (uppercase):', key2);
  try {
    const p2 = await up.getData(key2);
    console.log('Result:', p2, '\n');
  } catch (e) {
    console.log('Error:', e.message, '\n');
  }
  
  // Format 3: With checksum
  const key3 = '0x4b80742d0000000082ac0000' + ethers.getAddress(CONTROLLER).slice(2).toLowerCase();
  console.log('Format 3 (checksum):', key3);
  try {
    const p3 = await up.getData(key3);
    console.log('Result:', p3, '\n');
  } catch (e) {
    console.log('Error:', e.message, '\n');
  }
}

check();
