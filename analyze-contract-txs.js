const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';

// Known function signatures for common patterns
const KNOWN_SIGNATURES = {
  // Registry
  'registerCollection(address,bytes)': '0x8a75b1d5',
  'createCollection(bytes)': '0x19b99154',
  'registerCollection(address,string,string,bytes)': '0x5c8f8e32',
  
  // Factory
  'mintMoment(address,bytes,address)': '0x2b3c4d5e',
  'mintMoment(address,bytes)': '0x5c8f8e32',
  'mintToCollection(address,bytes,address)': '0x8a75b1d5',
  
  // Standard
  'owner()': '0x8da5cb5b',
  'supportsInterface(bytes4)': '0x01ffc9a7'
};

async function analyzeTransactions() {
  console.log('🔍 Analyzing Contract Transactions\n');
  
  const currentBlock = await provider.getBlockNumber();
  console.log('Current block:', currentBlock);
  console.log('');
  
  // Check transactions to registry
  console.log('📚 Collection Registry:', COLLECTION_REGISTRY);
  
  // Get bytecode
  const registryCode = await provider.getCode(COLLECTION_REGISTRY);
  console.log('  Code length:', registryCode.length);
  console.log('  Has code:', registryCode !== '0x');
  
  const factoryCode = await provider.getCode(MOMENT_FACTORY);
  console.log('');
  console.log('📦 Moment Factory:', MOMENT_FACTORY);
  console.log('  Code length:', factoryCode.length);
  console.log('  Has code:', factoryCode !== '0x');
  
  // Try to find transactions by looking at recent blocks
  console.log('');
  console.log('🔎 Scanning recent blocks for transactions...');
  
  let foundTxs = [];
  const scanBlocks = 100;
  
  for (let i = 0; i < scanBlocks; i++) {
    const blockNum = currentBlock - i;
    try {
      const block = await provider.getBlock(blockNum, true);
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          if (tx.to === COLLECTION_REGISTRY || tx.to === MOMENT_FACTORY) {
            foundTxs.push({
              block: blockNum,
              hash: tx.hash,
              to: tx.to,
              data: tx.data.slice(0, 10),
              dataFull: tx.data
            });
          }
        }
      }
    } catch (e) {
      // Skip
    }
  }
  
  console.log(`  Found ${foundTxs.length} transactions to target contracts`);
  
  if (foundTxs.length > 0) {
    console.log('');
    console.log('Transaction samples:');
    foundTxs.slice(0, 5).forEach((tx, i) => {
      console.log(`  ${i + 1}. Block ${tx.block} -> ${tx.to.slice(0, 10)}...`);
      console.log(`     Hash: ${tx.hash}`);
      console.log(`     Selector: ${tx.data}`);
      console.log(`     Data length: ${tx.dataFull.length}`);
    });
  }
  
  console.log('');
  console.log('✅ Analysis complete');
  
  return foundTxs;
}

analyzeTransactions().then(txs => {
  if (txs.length > 0) {
    console.log('');
    console.log('Full transaction data for first tx:');
    console.log(txs[0].dataFull.slice(0, 200) + '...');
  }
}).catch(err => {
  console.error('❌ Error:', err.message);
});