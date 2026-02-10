const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

async function find() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const upAbi = ['event DataChanged(bytes32 indexed dataKey, bytes value)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  // Search from deployment (around block 6M)
  const filter = up.filters.DataChanged();
  const events = await up.queryFilter(filter, 6000000, 'latest');
  
  console.log('Total DataChanged events:', events.length);
  console.log('\nGrid-related keys (starting with 0x68b6):\n');
  
  events.forEach(event => {
    const key = event.args.dataKey;
    if (key.startsWith('0x68b6')) {
      console.log('Key:', key);
      console.log('Block:', event.blockNumber);
      console.log('---');
    }
  });
}

find().catch(console.error);
