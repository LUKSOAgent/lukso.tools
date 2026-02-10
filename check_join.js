const { ethers } = require('ethers');
const TX = '0xb4a14a3786aaadb221da830841d40f89f5e095f2b40084cef5c6ee0239c7ce14';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const receipt = await provider.getTransactionReceipt(TX);
  if (receipt) {
    console.log('Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Gas:', receipt.gasUsed.toString());
  } else {
    console.log('Pending...');
  }
}
check();
