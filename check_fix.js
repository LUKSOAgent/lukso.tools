const { ethers } = require('ethers');

const TX1 = '0xd0a858974205634ea979dddbb812186af7bdce271019edc6aa84e8cec8724301';
const TX2 = '0x87b75c712a5dbc27ab9e6eebfc7804cf8b202fa4b102bfabc00740988b571ecf';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const r1 = await provider.getTransactionReceipt(TX1);
  console.log('TX1 (cells 0-4):', r1?.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
  
  const r2 = await provider.getTransactionReceipt(TX2);
  if (r2) {
    console.log('TX2 (cells 5-8):', r2.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
  } else {
    console.log('TX2: Pending...');
  }
}

check();
