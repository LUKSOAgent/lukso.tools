const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TX_HASH = '0xf825e3d32616fed7aa83b98a07216cfad1025ed98181fb13348dd998debad9ae';

async function check() {
  console.log('Checking transaction...');
  
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  
  if (receipt) {
    console.log(receipt.status === 1 ? '✅ SUCCESS!' : '❌ FAILED');
    console.log('Block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Logs:', receipt.logs.length);
    
    if (receipt.status === 1) {
      console.log('\n🎉 LIQUIDITY ADDED!');
      
      // Find Transfer event for NFT
      const transferTopic = ethers.id('Transfer(address,address,uint256)');
      for (const log of receipt.logs) {
        if (log.topics[0] === transferTopic) {
          const tokenId = BigInt(log.topics[3]);
          console.log('NFT Token ID:', tokenId.toString());
        }
      }
      
      console.log('\nExplorer:');
      console.log('https://explorer.execution.mainnet.lukso.network/tx/' + TX_HASH);
    }
  } else {
    console.log('⏳ Still pending...');
  }
}

check();