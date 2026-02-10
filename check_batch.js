const { ethers } = require('ethers');

const TX1 = '0x91a7c5ffd1efefbe36a4ba24b3b132ee50e6383902b596943d5cfdbd7cb7e190';
const TX2 = '0xdf9e7fb83ae86680ae884cb092efc817160727c716ae5ed1097f34b682d26d83';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const r1 = await provider.getTransactionReceipt(TX1);
  console.log('TX1 (Cells 0-2):', r1?.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
  
  const r2 = await provider.getTransactionReceipt(TX2);
  if (r2) {
    console.log('TX2 (Cells 3-5):', r2.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
  } else {
    console.log('TX2: Still pending...');
  }
}

check();
