const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TX_HASH = '0x9f8f9e976260799865e1d182624a2948eae6dcbf50fcdeea0a2e9da87860e965';

async function check() {
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  
  if (receipt) {
    console.log(receipt.status === 1 ? '🎉 SUCCESS!' : '❌ FAILED');
    console.log('Block:', receipt.blockNumber);
    console.log('Gas:', receipt.gasUsed.toString());
    console.log('Logs:', receipt.logs.length);
    
    if (receipt.status === 1) {
      console.log('\n✅ LIQUIDITY ADDED TO AGENTPO/WLYX POOL!');
      console.log('https://explorer.execution.mainnet.lukso.network/tx/' + TX_HASH);
      
      for (const log of receipt.logs) {
        if (log.topics[0] === ethers.id('Transfer(address,address,uint256)')) {
          console.log('\nNFT Token ID:', BigInt(log.topics[3]).toString());
        }
      }
    }
  } else {
    console.log('⏳ Pending...');
  }
}

check();