const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TX_HASH = '0x113eae03a34c79ec4327d6fd6fc0ce3ffb5a3814ca1224c545d0886d088a9671';

async function check() {
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  
  if (receipt) {
    console.log(receipt.status === 1 ? '🎉 SUCCESS!' : '❌ FAILED');
    console.log('Block:', receipt.blockNumber);
    console.log('Gas:', receipt.gasUsed.toString());
    
    if (receipt.status === 1) {
      console.log('\n✅ EXTRA LIQUIDITY ADDED!');
      console.log('https://explorer.execution.mainnet.lukso.network/tx/' + TX_HASH);
      
      for (const log of receipt.logs) {
        if (log.topics[0] === ethers.id('Transfer(address,address,uint256)')) {
          console.log('NFT Token ID:', BigInt(log.topics[3]).toString());
        }
      }
    }
  } else {
    console.log('⏳ Pending...');
  }
}

check();