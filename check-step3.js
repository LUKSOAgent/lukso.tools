const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TX_HASH = '0x727d6a70b6ad542a8512ab8be5f85db73af606e9f8ff5713ef39f0adf81cd90a';

async function check() {
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  if (receipt) {
    console.log(receipt.status === 1 ? '✅ SUCCESS!' : '❌ FAILED');
    console.log('Block:', receipt.blockNumber);
  } else {
    console.log('⏳ Pending...');
  }
}

check();