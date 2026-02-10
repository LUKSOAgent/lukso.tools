const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TEST_CONTROLLER = '0xf4dF36124d5D1bBEc1EE55CA20F70905E0f59e2b';

// LSP23 Factory
const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';

async function checkTransactions() {
  console.log('🔍 Checking transaction history...\n');
  
  // Get the latest block
  const latestBlock = await provider.getBlockNumber();
  console.log('Latest block:', latestBlock);
  
  // Unfortunately we can't easily get tx history without an indexer
  // Let's check if there are any logs from LSP23 factory involving this address
  
  const factoryAbi = [
    "event UniversalProfileDeployed(address indexed upAddress, address indexed kmAddress, address indexed controller)"
  ];
  
  const factory = new ethers.Contract(LSP23_FACTORY, factoryAbi, provider);
  
  // Query events for the last 1000 blocks
  const fromBlock = latestBlock - 1000;
  
  try {
    const filter = factory.filters.UniversalProfileDeployed(null, null, TEST_CONTROLLER);
    const events = await factory.queryFilter(filter, fromBlock, latestBlock);
    
    if (events.length > 0) {
      console.log('\n✅ Deployment events found!\n');
      for (const event of events) {
        console.log('UP Address:', event.args.upAddress);
        console.log('KeyManager:', event.args.kmAddress);
        console.log('Controller:', event.args.controller);
        console.log('Block:', event.blockNumber);
        console.log('Tx:', event.transactionHash);
      }
    } else {
      console.log('\n⚠️ No deployment events found for this controller.');
      console.log('Transactions may have been something else (e.g., testing).');
      
      // Check if UP exists by checking code at predicted addresses
      console.log('\nChecking for UP at common factory-generated addresses...');
    }
  } catch (err) {
    console.log('Error querying events:', err.message);
  }
}

checkTransactions().catch(console.error);
