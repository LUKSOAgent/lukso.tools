const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

async function find() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const blockNumber = await provider.getBlockNumber();
  const upAbi = ['event DataChanged(bytes32 indexed dataKey, bytes value)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  const filter = up.filters.DataChanged();
  const events = await up.queryFilter(filter, blockNumber - 50000, blockNumber);
  
  console.log('Grid-related keys (starting with 0x68b6):\n');
  
  events.forEach(event => {
    const key = event.args.dataKey;
    if (key.startsWith('0x68b6')) {
      console.log('Key:', key);
      console.log('Block:', event.blockNumber);
      console.log('Value:', event.args.value.slice(0, 100));
      console.log('---');
    }
  });
}

find().catch(console.error);
