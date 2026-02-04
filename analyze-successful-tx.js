const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

async function analyzeSuccessfulTx() {
  try {
    // The successful batch follow transaction from yesterday
    const receipt = await provider.getTransactionReceipt('0x20e60cd6bb25348242e98068de66a7babbd8138f501ff761f91195d563f1f09a');
    
    console.log('===== SUCCESSFUL TRANSACTION ANALYSIS =====');
    console.log('Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('To:', receipt.to);
    console.log('From:', receipt.from);
    console.log('Logs count:', receipt.logs.length);
    
    console.log('\n===== LOGS (EVENTS) =====');
    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i];
      console.log(`Log ${i}:`);
      console.log('  Address:', log.address);
      console.log('  Topics:', log.topics.slice(0, 2)); // First 2 topics
      console.log('  Data length:', log.data.length);
    }
    
    // Get the transaction itself to see input data
    const tx = await provider.getTransaction('0x20e60cd6bb25348242e98068de66a7babbd8138f501ff761f91195d563f1f09a');
    console.log('\n===== TRANSACTION INPUT =====');
    console.log('Input data length:', tx.data.length);
    console.log('Input first 100 chars:', tx.data.substring(0, 100));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeSuccessfulTx();