const { ethers } = require('ethers');

const TX_HASH = '0x825f6c592e18e79de23b3464fe6234ca007bc91089045416c2f82e266c8a870a';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const tx = await provider.getTransaction(TX_HASH);
  console.log('Transaction:', tx);
  
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  console.log('\nReceipt:', receipt);
  
  // Check logs
  console.log('\nLogs:', receipt.logs);
}

check().catch(console.error);
