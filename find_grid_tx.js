const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

async function find() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  // Get recent transactions
  const blockNumber = await provider.getBlockNumber();
  console.log('Current block:', blockNumber);
  
  // Check if there are any logs from my UP
  const upAbi = ['event DataChanged(bytes32 indexed dataKey, bytes value)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  // Get past DataChanged events
  const filter = up.filters.DataChanged();
  const events = await up.queryFilter(filter, blockNumber - 10000, blockNumber);
  
  console.log('Found', events.length, 'DataChanged events');
  
  // Look for grid-related keys (starting with 0x68b6)
  events.forEach(event => {
    const key = event.args.dataKey;
    if (key.startsWith('0x68b6')) {
      console.log('Grid key:', key, 'at block', event.blockNumber);
    }
  });
}

find().catch(console.error);
