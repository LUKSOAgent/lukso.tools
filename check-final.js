const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TX_HASH = '0x131aba3ea078d81207d6672f0d042700f2df0aad287e50a032a7209d411356bb';

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