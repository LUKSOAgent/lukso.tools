const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.mainnet.lukso.network';
const provider = new ethers.JsonRpcProvider(RPC_URL);

const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';

async function check() {
  const abi = [
    'function owner() view returns (address)',
    'function controllers(address) view returns (bool)',
    'function paused() view returns (bool)',
    'event CollectionCreated(address indexed collectionUP, address indexed ownerUP, address indexed controllerUP)'
  ];
  
  const registry = new ethers.Contract(COLLECTION_REGISTRY, abi, provider);
  
  const owner = await registry.owner();
  console.log('Registry owner:', owner);
  
  // Check if registry is paused
  try {
    const paused = await registry.paused();
    console.log('Registry paused:', paused);
  } catch (e) {
    console.log('No paused() function');
  }
  
  // Check controller status for various addresses
  const addressesToCheck = [
    '0xE093A714960da1bF297522617BfC08132b62B86a', // deployer
    '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5', // controller from credentials
    '0x293E96ebbf264ed7715cff2b67850517De70232a', // owner UP
  ];
  
  console.log('\nChecking controller status:');
  for (const addr of addressesToCheck) {
    try {
      const isCtrl = await registry.controllers(addr);
      console.log(`${addr}: ${isCtrl}`);
    } catch (e) {
      console.log(`${addr}: error - ${e.message}`);
    }
  }
  
  // Look at recent transactions to see how others created collections
  console.log('\nLooking at recent blocks for CollectionCreated events...');
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = currentBlock - 10000;
  
  try {
    const filter = registry.filters.CollectionCreated();
    const events = await registry.queryFilter(filter, fromBlock, currentBlock);
    console.log(`Found ${events.length} CollectionCreated events`);
    
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      console.log('\nLast collection created:');
      console.log('  Collection UP:', lastEvent.args.collectionUP);
      console.log('  Owner UP:', lastEvent.args.ownerUP);
      console.log('  Controller UP:', lastEvent.args.controllerUP);
      console.log('  Transaction:', lastEvent.transactionHash);
    }
  } catch (e) {
    console.log('Error querying events:', e.message);
  }
}

check().catch(console.error);
