const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const WLYX = '0x6b6F4cb50e67adb082300b90Af49AF499D41d04E';

// Factory address from earlier
const FACTORY = '0xf9bafd57e49a8cb38465414e4a84560b10ee40e3';

async function findPair() {
  console.log('🔍 Finding AGENTPO/WLYX Pair\n');
  
  // Get factory bytecode
  const factoryCode = await provider.getCode(FACTORY);
  console.log('Factory code length:', factoryCode.length);
  console.log('Factory has code:', factoryCode.length > 2 ? '✅ Yes' : '❌ No');
  console.log('');
  
  // The pair we created earlier
  // From the createPair transaction: 0x7da23efec11494e6a566ca27ba5b5cd82b1651574c8b4cb9ffdebaee0eee99d3
  console.log('Pair was created in tx: 0x7da23efec11494e6a566ca27ba5b5cd82b1651574c8b4cb9ffdebaee0eee99d3');
  console.log('');
  
  // Try to find the pair from the transaction receipt
  console.log('Looking for PairCreated event...');
  
  const receipt = await provider.getTransactionReceipt('0x7da23efec11494e6a566ca27ba5b5cd82b1651574c8b4cb9ffdebaee0eee99d3');
  
  if (receipt) {
    console.log('Transaction found!');
    console.log('Block:', receipt.blockNumber);
    console.log('Logs:', receipt.logs.length);
    
    // Look for PairCreated event
    // PairCreated(topic0, token0, token1, pair)
    for (const log of receipt.logs) {
      console.log('  Log address:', log.address);
      console.log('  Topics:', log.topics.length);
      
      // If this is from the factory, it might be the PairCreated event
      if (log.address.toLowerCase() === FACTORY) {
        console.log('  -> This is a Factory log!');
        // The pair address is usually in the data or topics
        if (log.topics.length >= 3) {
          // Check if topics match our tokens
          console.log('  Topic 1:', log.topics[1]);
          console.log('  Topic 2:', log.topics[2]);
        }
      }
    }
  }
  
  console.log('');
  console.log('📋 Conclusion:');
  console.log('The pair was created but we need to verify its address');
  console.log('The Router.addLiquidityETH() keeps failing');
  console.log('This might be because:');
  console.log('1. The pair is not a standard Uniswap V2 pair');
  console.log('2. Universal Swaps uses a different architecture');
  console.log('3. We need to use a different method');
}

findPair().catch(console.error);