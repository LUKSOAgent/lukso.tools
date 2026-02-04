const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

async function checkTransaction(txHash) {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    console.log(`\nTx ${txHash}:`);
    console.log('Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Logs:', receipt.logs.length);
    
    if (receipt.logs.length > 0) {
      console.log('Events emitted - transaction had effect');
    } else {
      console.log('No events - likely reverted silently');
    }
    
  } catch (error) {
    console.error('Error checking tx:', error.message);
  }
}

// Check the recent follow transactions
async function checkAll() {
  await checkTransaction('0xf3ede2a3fa900c47e76aa54d4446416e2ac61a28de1eb796811d6f0a2be934fa'); // theCryptoson
  await checkTransaction('0xe758752929a413885256d72ddfdac1996fe1aba2058c7c2e16647cc92629f3fd'); // 0xantonioeth (from system log)
}

checkAll();