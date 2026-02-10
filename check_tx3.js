const { ethers } = require('ethers');

const TX3 = '0xbd0b6f968bd04cc62735468c95ea33dfcf8379b048892ff6c8667f0cc3d92bc1';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const r3 = await provider.getTransactionReceipt(TX3);
  if (r3) {
    console.log('TX3 (Cells 6-8):', r3.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Gas used:', r3.gasUsed.toString());
  } else {
    console.log('TX3: Still pending...');
  }
}

check();
