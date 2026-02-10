const { ethers } = require('ethers');

const TX_HASH = '0x9bca23b0411df626d4cbd05a3cdcc02f6511207489cb58ab4e533205cf8cd0d3';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

async function checkTransaction() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  console.log('🔍 Checking Transaction:', TX_HASH);
  console.log('');
  
  try {
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    const tx = await provider.getTransaction(TX_HASH);
    
    if (!tx) {
      console.log('❌ Transaction not found');
      return;
    }
    
    console.log('📋 Transaction Details:');
    console.log('From:', tx.from);
    console.log('To:', tx.to);
    console.log('Value:', ethers.formatEther(tx.value), 'LYX');
    console.log('Block:', tx.blockNumber);
    console.log('Status:', receipt?.status === 1 ? '✅ Success' : '❌ Failed');
    console.log('');
    
    // Check my UP balance
    const balance = await provider.getBalance(MY_UP);
    console.log('💰 My UP Balance:', ethers.formatEther(balance), 'LYX');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkTransaction().catch(console.error);
