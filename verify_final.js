const { ethers } = require('ethers');

const TX = '0x6d362c85650e43d0e5e346ae38c56ab22e94d7f95ed466633709822dfcf26c5a';
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
    
    console.log('\nGrid data starts with:', data.slice(0, 40));
    console.log('Should start with: 0x00008019f9b10020...');
    
    if (data.startsWith('0x00008019f9b10020')) {
      console.log('✅ CORRECT METHOD! (8019f9b1 = keccak256(bytes))');
    }
  }
}

verify();
