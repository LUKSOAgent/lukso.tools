const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const POOL = '0x05ce285A8ac77710AAfDcbD1B26Cf6af3bD1afAb';

async function analyzeTransactions() {
  console.log('🔍 Analyzing Pool Transactions\n');
  
  // Get recent transactions to/from this pool
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = currentBlock - 10000;
  
  console.log('Scanning blocks', fromBlock, 'to', currentBlock);
  console.log('');
  
  // Get the pool's ETH balance
  const balance = await provider.getBalance(POOL);
  console.log('Pool LYX balance:', ethers.formatEther(balance));
  
  // Look for any events
  const filter = {
    address: POOL,
    fromBlock: fromBlock,
    toBlock: currentBlock
  };
  
  try {
    const logs = await provider.getLogs(filter);
    console.log('\nFound', logs.length, 'logs');
    
    for (const log of logs.slice(0, 10)) {
      console.log('');
      console.log('Log:');
      console.log('  Block:', log.blockNumber);
      console.log('  Tx Hash:', log.transactionHash);
      console.log('  Topics:', log.topics.length);
      console.log('  Data:', log.data.substring(0, 66) + '...');
      
      // Try to decode common event signatures
      if (log.topics.length > 0) {
        const sig = log.topics[0];
        const eventSigs = {
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer',
          '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1': 'Sync',
          '0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f': 'Mint',
          '0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496': 'Burn',
          '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67': 'Swap'
        };
        
        if (eventSigs[sig]) {
          console.log('  Event:', eventSigs[sig]);
        }
      }
    }
  } catch (e) {
    console.log('Error getting logs:', e.message);
  }
  
  console.log('');
  console.log('Looking at specific transactions...');
}

async function analyzeContract() {
  console.log('\n🔍 Contract Code Analysis\n');
  
  const code = await provider.getCode(POOL);
  console.log('Code length:', code.length);
  
  // Check for specific patterns
  const hasCreate2 = code.includes('f5'); // CREATE2 opcode
  const hasDelegate = code.includes('f4'); // DELEGATECALL
  const hasStatic = code.includes('fa'); // STATICCALL
  
  console.log('Has CREATE2:', hasCreate2 ? '✅' : '❌');
  console.log('Has DELEGATECALL:', hasDelegate ? '✅' : '❌');
  console.log('Has STATICCALL:', hasStatic ? '✅' : '❌');
  
  // Look for common addresses in bytecode
  const KNOWN_ADDRESSES = [
    'B718886a34595C09ff5437875079E8ff2365c6E6', // Factory
    '6b6F4cb50e67adb082300b90Af49AF499D41d04E', // WLYX
    'A46d16FB9F228785cF1A7C20415bb5AfC193945A', // Router
  ];
  
  console.log('\nLooking for known addresses:');
  for (const addr of KNOWN_ADDRESSES) {
    const cleanAddr = addr.toLowerCase();
    const found = code.toLowerCase().includes(cleanAddr);
    console.log(`  ${addr}: ${found ? '✅ Found' : '❌ Not found'}`);
  }
}

async function main() {
  await analyzeTransactions();
  await analyzeContract();
}

main().catch(console.error);