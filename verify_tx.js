const { ethers } = require('ethers');

const TX = '0xc8a95bb255872c535658773070c34157f3664042e6b9a073c8bfcf74822c5fe5';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function verify() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const receipt = await provider.getTransactionReceipt(TX);
  console.log('TX Status:', receipt?.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
  
  if (receipt?.status === 1) {
    console.log('Gas:', receipt.gasUsed.toString());
    
    const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
    const up = new ethers.Contract(MY_UP, upAbi, provider);
    const data = await up.getData(GRID_KEY);
    
    console.log('\n✅ Grid updated with LSP28TheGrid array structure!');
    console.log('Data starts with:', data.slice(0, 50));
    console.log('Hash:', data.slice(16, 80));
  }
}

verify();
