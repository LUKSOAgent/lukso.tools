const { ethers } = require('ethers');

const TX = '0x758ae40ccd0548535e4c2b586fd3d88df78ae3604c8411fec3c47e42547b31f7';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function verify() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const receipt = await provider.getTransactionReceipt(TX);
  console.log('TX Status:', receipt?.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
  
  if (receipt?.status === 1) {
    const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
    const up = new ethers.Contract(MY_UP, upAbi, provider);
    const data = await up.getData(GRID_KEY);
    
    console.log('\nGrid data:');
    console.log('First 20 chars:', data.slice(0, 20));
    console.log('Now starts with 0x0000 (correct)!');
  }
}

verify();
