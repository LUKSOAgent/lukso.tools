const { ethers } = require('ethers');

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const receipt = await provider.getTransactionReceipt('0x2a02e33ac62380e3ee828b3a00efe66e7e8c248f983246bfd175d51dd0d9a83f');
  if (receipt) {
    console.log('Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Gas:', receipt.gasUsed.toString());
    console.log('Block:', receipt.blockNumber);
  } else {
    console.log('Still pending or not found');
  }
}
check();
