const { ethers } = require('ethers');
const TX = '0x2a02e33ac62380e3ee828b3a00efe66e7e8c248f983246bfd175d51dd0d9a83f';

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
