const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TX_HASH = '0x935ed755c8a613545e5d8a455fd74b63ce874ce9ac8cfbba6e704597da927572';

async function findPoolAddress() {
  console.log('🔍 Finding Actual Pool Address\n');
  
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  
  console.log('Transaction:', TX_HASH);
  console.log('Block:', receipt.blockNumber);
  console.log('Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ Failed');
  console.log('Logs:', receipt.logs.length);
  console.log('');
  
  // Look for PoolCreated event
  // PoolCreated(token0, token1, fee, tickSpacing, pool)
  const poolCreatedTopic = ethers.id('PoolCreated(address,address,uint24,int24,address)');
  
  for (const log of receipt.logs) {
    console.log('Log address:', log.address);
    console.log('Topic 0:', log.topics[0]);
    console.log('Matches PoolCreated?', log.topics[0] === poolCreatedTopic);
    console.log('');
    
    if (log.topics[0] === poolCreatedTopic) {
      console.log('🎉 POOL CREATED EVENT FOUND!');
      console.log('Token0:', '0x' + log.topics[1].slice(26));
      console.log('Token1:', '0x' + log.topics[2].slice(26));
      
      // Pool address is in data
      const poolAddress = ethers.getAddress('0x' + log.data.slice(26, 66));
      console.log('Pool Address:', poolAddress);
      
      // Also decode fee and tickSpacing from data
      const fee = BigInt('0x' + log.data.slice(2, 66));
      console.log('Fee:', Number(fee));
      
      return poolAddress;
    }
  }
  
  console.log('Could not find PoolCreated event');
}

findPoolAddress();