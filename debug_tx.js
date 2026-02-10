const { ethers } = require('ethers');

const TX = '0x758ae40ccd0548535e4c2b586fd3d88df78ae3604c8411fec3c47e42547b31f7';

async function debug() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const tx = await provider.getTransaction(TX);
  const receipt = await provider.getTransactionReceipt(TX);
  
  console.log('Transaction:');
  console.log('Hash:', tx?.hash);
  console.log('Status:', receipt?.status);
  console.log('Gas used:', receipt?.gasUsed?.toString());
  console.log('Block:', receipt?.blockNumber);
  
  if (receipt?.status === 0) {
    console.log('\n❌ Transaction failed!');
    // Try to get revert reason
    try {
      await provider.call({
        to: tx.to,
        from: tx.from,
        data: tx.data,
        value: tx.value
      });
    } catch (e) {
      console.log('Revert reason:', e.message);
    }
  }
}

debug();
