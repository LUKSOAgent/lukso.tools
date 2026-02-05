const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.mainnet.lukso.network';
const provider = new ethers.JsonRpcProvider(RPC_URL);

const FAILED_TX = '0x742359ba3d9d8d8fe9f6df1e2c1f746f7dca901b99065e67d1be5bfcd4bc99b3';

async function debug() {
  const tx = await provider.getTransaction(FAILED_TX);
  console.log('Transaction details:');
  console.log('  To:', tx.to);
  console.log('  From:', tx.from);
  console.log('  Data length:', tx.data.length);
  console.log('  Gas limit:', tx.gasLimit.toString());
  
  const receipt = await provider.getTransactionReceipt(FAILED_TX);
  console.log('\nReceipt details:');
  console.log('  Status:', receipt.status);
  console.log('  Gas used:', receipt.gasUsed.toString());
  console.log('  Logs count:', receipt.logs.length);
  
  // Try to get revert reason
  try {
    const result = await provider.call(tx, tx.blockNumber - 1);
    console.log('Call result:', result);
  } catch (e) {
    console.log('Call error:', e.reason || e.message);
  }
}

debug().catch(console.error);
