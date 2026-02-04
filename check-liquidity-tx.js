const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TX_HASH = '0x4f8fc8abd7c1d9af4aaba3bb01f3742fe5420a84ea605c7a30c48fa5a3b5c3d5';

async function check() {
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  if (receipt) {
    console.log(receipt.status === 1 ? '✅ SUCCESS!' : '❌ FAILED');
    console.log('Block:', receipt.blockNumber);
    console.log('Gas:', receipt.gasUsed.toString());
    console.log('Logs:', receipt.logs.length);
    if (receipt.status === 1) {
      console.log('\n🎉 Liquidity added successfully!');
      console.log('https://explorer.execution.mainnet.lukso.network/tx/' + TX_HASH);
    }
  } else {
    console.log('⏳ Pending...');
  }
}

check();