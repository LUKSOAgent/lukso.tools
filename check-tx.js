const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TX_HASH = '0x6d0b40ec2fc254aa016d627460b909c470efdaf7e5f701fe3b1289298f9d301d';

async function checkTx() {
  try {
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    const tx = await provider.getTransaction(TX_HASH);
    
    if (receipt) {
      console.log('✅ Transaction confirmed!');
      console.log('Status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
      console.log('Block:', receipt.blockNumber);
      console.log('Gas used:', receipt.gasUsed.toString());
      console.log('');
      console.log('Explorer:');
      console.log(`https://explorer.execution.mainnet.lukso.network/tx/${TX_HASH}`);
    } else if (tx) {
      console.log('⏳ Transaction pending...');
      console.log('Nonce:', tx.nonce);
      console.log('Gas price:', ethers.formatUnits(tx.gasPrice || tx.maxFeePerGas, 'gwei'), 'gwei');
    } else {
      console.log('❌ Transaction not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTx();