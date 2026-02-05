const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';

async function checkRegistry() {
  console.log('=== Checking CollectionRegistry ===\n');
  
  // Check code
  const code = await provider.getCode(REGISTRY);
  console.log('Registry has code:', code.length > 2 ? `✅ YES (${code.length} bytes)` : '❌ NO');
  console.log('');
  
  // Try to read some basic info
  const BASIC_ABI = [
    {
      "inputs": [],
      "name": "owner",
      "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
      "stateMutability": "view",
      "type": "function"
    }
  ];
  
  const registry = new ethers.Contract(REGISTRY, BASIC_ABI, provider);
  
  try {
    const owner = await registry.owner();
    console.log('Registry owner:', owner);
  } catch (e) {
    console.log('Error getting owner:', e.message);
  }
  
  // Check recent events
  console.log('');
  console.log('=== Recent Events ===');
  
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = currentBlock - 10000;
  
  const filter = {
    address: REGISTRY,
    fromBlock: fromBlock,
    toBlock: 'latest'
  };
  
  const logs = await provider.getLogs(filter);
  console.log(`Found ${logs.length} logs in last 10000 blocks`);
  
  if (logs.length > 0) {
    console.log('\nRecent events (last 5):');
    logs.slice(-5).forEach((log, i) => {
      console.log(`  ${i+1}. Topics: ${log.topics[0].slice(0, 30)}...`);
    });
  }
}

checkRegistry().catch(console.error);
