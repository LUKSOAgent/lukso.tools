const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const txs = [
  '0xd46b1d48909d91b0f1868f35cc4c4a6eb03fc3fce1a7b2322b739fbed448be3e', // 420 followers
  '0xfa9ee9dd5265765c48650a03b61b06e4a89b35c1f3b4317dd0b845473b968100', // Twin Brothers
  '0xfec75a618e7296032de06e78c581b0ba933f6d3fa3791cdfb596db585e17f5d2'  // Weekly Recap
];

async function getMomentAddresses() {
  for (const hash of txs) {
    console.log(`\nTX: ${hash}`);
    try {
      const receipt = await provider.getTransactionReceipt(hash);
      console.log('Logs count:', receipt.logs.length);
      
      // Look for LSP4 events or new contract creation
      for (const log of receipt.logs) {
        console.log('  Log:', log.address, log.topics[0]);
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

getMomentAddresses();
