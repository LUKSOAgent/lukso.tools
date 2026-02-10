const { ethers } = require('ethers');

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  // Check my actual stored value
  const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
  const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';
  
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  const data = await up.getData(GRID_KEY);
  
  console.log('My current LSP28TheGrid value:');
  console.log('Full value (first 100 chars):', data.slice(0, 100));
  console.log('');
  console.log('Bytes breakdown:');
  console.log('Position 0-1 (0x):', data.slice(0, 2));
  console.log('Position 2-5 (bytes2):', data.slice(2, 6));
  console.log('Position 6-13 (bytes4):', data.slice(6, 14));
  console.log('Position 14-17 (bytes2):', data.slice(14, 18));
  console.log('Position 18-21 (next bytes):', data.slice(18, 22));
  console.log('');
  console.log('The issue Jean is pointing out:');
  console.log('Current starts with: 0x0000000000000000...');
  console.log('Should start with just: 0x0000...');
  console.log('');
  console.log('Maybe the format is just:');
  console.log('0x0000 + <encoded URL>');
  console.log('NOT:');
  console.log('0x0000000000000000 + <encoded URL>');
}

check();
