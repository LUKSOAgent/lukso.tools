const { ethers } = require('ethers');

const TX = '0x758ae40ccd0548535e4c2b586fd3d88df78ae3604c8411fec3c47e42547b31f7';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const receipt = await provider.getTransactionReceipt(TX);
  
  if (receipt) {
    console.log('Status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
    console.log('Gas:', receipt.gasUsed.toString());
    
    if (receipt.status === 0) {
      // Try to decode the revert
      const tx = await provider.getTransaction(TX);
      try {
        await provider.call({
          to: tx.to,
          data: tx.data,
          from: tx.from
        }, tx.blockNumber);
      } catch (e) {
        console.log('Error:', e.message);
      }
    }
  } else {
    console.log('Transaction pending or not found...');
  }
}

check();
