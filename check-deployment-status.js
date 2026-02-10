const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

// The controller we funded for testing
const TEST_CONTROLLER = '0xf4dF36124d5D1bBEc1EE55CA20F70905E0f59e2b';

async function checkStatus() {
  console.log('🔍 Checking test controller status...\n');
  
  const balance = await provider.getBalance(TEST_CONTROLLER);
  console.log('💰 Balance:', ethers.formatEther(balance), 'LYX');
  console.log('📍 Address:', TEST_CONTROLLER);
  
  // Check if any transactions were sent from this address
  const nonce = await provider.getTransactionCount(TEST_CONTROLLER);
  console.log('📝 Transaction count (nonce):', nonce);
  
  if (nonce > 0) {
    console.log('\n✅ Transactions were sent! Deployment likely attempted.');
    
    // Check transaction history would need an explorer API
    console.log('\nExplorer link:');
    console.log(`https://explorer.execution.mainnet.lukso.network/address/${TEST_CONTROLLER}`);
  } else {
    console.log('\n⚠️ No transactions yet. Funds still unused.');
  }
  
  // Check if a UP was deployed (we'd need to know the expected UP address)
  // LSP23 factory creates deterministic addresses based on salt/init
}

checkStatus().catch(console.error);
