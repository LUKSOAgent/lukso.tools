const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

// Jordy's pair creation tx (we need to find this)
const JORDY_PAIR = '0xB9ddaE8a609167472549f7A68425c47Dba3515EC';

async function findJordyCreationTx() {
  console.log('🔍 Finding Jordy Pair Creation Transaction\n');
  
  // The pair was created at block 3882924 (from earlier analysis)
  // Let's look for PairCreated events around that time
  
  const FACTORY = '0xB718886a34595C09ff5437875079E8ff2365c6E6';
  const PAIR_CREATED_TOPIC = '0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9';
  
  // Check recent blocks for the PairCreated event
  const currentBlock = await provider.getBlockNumber();
  console.log('Current block:', currentBlock);
  
  // Look for PairCreated events
  const filter = {
    address: FACTORY,
    fromBlock: 6874500, // Around when we tried
    toBlock: currentBlock,
    topics: [PAIR_CREATED_TOPIC]
  };
  
  console.log('Looking for PairCreated events...');
  
  try {
    const logs = await provider.getLogs(filter);
    console.log('Found', logs.length, 'PairCreated events');
    
    for (const log of logs) {
      console.log('');
      console.log('PairCreated Event:');
      console.log('  Block:', log.blockNumber);
      console.log('  Tx Hash:', log.transactionHash);
      console.log('  Address:', log.address);
      
      // Decode the event
      // PairCreated(token0, token1, pair, length)
      const token0 = '0x' + log.topics[1].slice(26);
      const token1 = '0x' + log.topics[2].slice(26);
      const pair = '0x' + log.data.slice(26, 66);
      
      console.log('  Token0:', token0);
      console.log('  Token1:', token1);
      console.log('  Pair:', pair);
      
      if (pair.toLowerCase() === JORDY_PAIR.toLowerCase()) {
        console.log('  ✅ This is Jordy pair!');
        
        // Get the full transaction
        const tx = await provider.getTransaction(log.transactionHash);
        console.log('');
        console.log('Creation Transaction:');
        console.log('  From:', tx.from);
        console.log('  To:', tx.to);
        console.log('  Gas Limit:', tx.gasLimit.toString());
        console.log('  Gas Price:', tx.gasPrice?.toString());
        console.log('  Nonce:', tx.nonce);
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

findJordyCreationTx();