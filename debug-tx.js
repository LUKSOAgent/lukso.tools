const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TX_HASH = '0x6d0b40ec2fc254aa016d627460b909c470efdaf7e5f701fe3b1289298f9d301d';

async function debugTx() {
  try {
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    
    if (!receipt) {
      console.log('Transaction not found');
      return;
    }
    
    console.log('Transaction Debug');
    console.log('=================\n');
    console.log('Hash:', TX_HASH);
    console.log('Status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
    console.log('Block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Gas limit:', receipt.gasLimit?.toString() || 'N/A');
    console.log('');
    
    // Get transaction
    const tx = await provider.getTransaction(TX_HASH);
    console.log('From:', tx.from);
    console.log('To:', tx.to);
    console.log('Value:', ethers.formatEther(tx.value), 'LYX');
    console.log('Data length:', tx.data.length, 'chars');
    console.log('');
    
    // Check if it was KeyManager -> UP -> Router
    if (receipt.logs && receipt.logs.length > 0) {
      console.log('Logs:', receipt.logs.length);
      receipt.logs.forEach((log, i) => {
        console.log(`  Log ${i}:`, log.address, '- Topics:', log.topics.length);
      });
    } else {
      console.log('No logs - transaction reverted early');
    }
    
    console.log('');
    console.log('Possible issues:');
    console.log('1. Router does not support LSP7 tokens directly');
    console.log('2. Wrong token pair format (native LYX vs WLYX)');
    console.log('3. Slippage too low');
    console.log('4. Deadline expired');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugTx();