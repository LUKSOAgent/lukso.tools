const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TX_HASH = '0x6c9232383135c59db697190908371d89db5e140fb2b73de9c3dea9f59993ea90';

async function check() {
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  if (receipt) {
    console.log(receipt.status === 1 ? '✅ SUCCESS!' : '❌ FAILED');
    console.log('Block:', receipt.blockNumber);
    console.log('Gas:', receipt.gasUsed.toString());
    console.log('Logs:', receipt.logs.length);
    
    if (receipt.status === 1) {
      console.log('\n🎉 LIQUIDITY ADDED!');
      console.log('https://explorer.execution.mainnet.lukso.network/tx/' + TX_HASH);
    }
  } else {
    console.log('⏳ Pending...');
  }
}

check();