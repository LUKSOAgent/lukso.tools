const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';

// Get recent transactions to the factory
async function findMintTransactions() {
  console.log('🔍 Searching for recent mint transactions...\n');
  
  // Get current block
  const currentBlock = await provider.getBlockNumber();
  console.log('Current block:', currentBlock);
  console.log('');
  
  // Look at recent blocks for factory interactions
  const startBlock = currentBlock - 10000;
  
  // Get the factory's code to understand its structure
  const code = await provider.getCode(FACTORY);
  console.log('Factory is a contract:', code.length > 2);
  console.log('Bytecode size:', code.length / 2 - 1, 'bytes');
  console.log('');
  
  // Let's look for the implementation contract
  const FACTORY_ABI = [
    'function getImplementation() view returns (address)',
    'function owner() view returns (address)',
    'function mintMoment(address recipient, bytes memory metadataURI, address collectionUP) returns (bytes32)',
    'event MomentMinted(address indexed moment, bytes32 indexed tokenId, address indexed collectionUP)'
  ];
  
  const factory = new ethers.Contract(FACTORY, FACTORY_ABI, provider);
  
  // Get recent logs for MomentMinted events
  const filter = {
    address: FACTORY,
    topics: [ethers.id('MomentMinted(address,bytes32,address)')],
    fromBlock: startBlock,
    toBlock: 'latest'
  };
  
  try {
    const logs = await provider.getLogs(filter);
    console.log(`Found ${logs.length} MomentMinted events in last 10000 blocks`);
    console.log('');
    
    // Show the 3 most recent
    for (let i = logs.length - 1; i >= Math.max(0, logs.length - 3); i--) {
      const log = logs[i];
      console.log(`Event [${i}]:`);
      console.log('  Transaction:', log.transactionHash);
      console.log('  Block:', log.blockNumber);
      console.log('  Topics:', log.topics);
      console.log('');
      
      // Get the transaction details
      const tx = await provider.getTransaction(log.transactionHash);
      if (tx) {
        console.log('  From:', tx.from);
        console.log('  To:', tx.to);
        console.log('  Value:', ethers.formatEther(tx.value), 'LYX');
        console.log('');
        
        // Check if it went through KeyManager
        const receipt = await provider.getTransactionReceipt(log.transactionHash);
        if (receipt) {
          console.log('  Gas Used:', receipt.gasUsed.toString());
          console.log('  Status:', receipt.status === 1 ? '✅ Success' : '❌ Failed');
          console.log('');
        }
      }
    }
    
  } catch (e) {
    console.log('Error fetching logs:', e.message);
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('Summary:');
  console.log('═══════════════════════════════════════════════════');
  console.log('Factory owner can mint directly or authorize minters');
  console.log('Users likely mint through Forever Moments UI');
  console.log('The mintMoment function is owner-only or requires authorization');
}

findMintTransactions();