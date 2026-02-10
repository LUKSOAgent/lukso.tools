const { ethers } = require('ethers');

const TX = '0x57b055ab0af4cd018421e9be88a1e20ba4906d4412c00a3941364a100f954473';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const receipt = await provider.getTransactionReceipt(TX);
  if (receipt) {
    console.log('TX Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Check the data
    const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
    const up = new ethers.Contract(MY_UP, upAbi, provider);
    const data = await up.getData(GRID_KEY);
    console.log('\nLSP28TheGrid data:');
    console.log('First 30 chars:', data.slice(0, 30));
    console.log('Length:', data.length);
  } else {
    console.log('Still pending...');
  }
}

check();
