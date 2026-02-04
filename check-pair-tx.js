const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TX_HASH = '0x7da23efec11494e6a566ca27ba5b5cd82b1651574c8b4cb9ffdebaee0eee99d3';

async function check() {
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  if (receipt) {
    console.log(receipt.status === 1 ? '✅ SUCCESS!' : '❌ FAILED');
    console.log('Block:', receipt.blockNumber);
    console.log('Gas:', receipt.gasUsed.toString());
    console.log('Logs:', receipt.logs.length);
    
    if (receipt.status === 1) {
      console.log('\n🎉 Pair created!');
      
      // Look for PairCreated event
      const eventSig = ethers.id('PairCreated(address,address,address,uint256)');
      const pairEvent = receipt.logs.find(l => l.topics[0] === eventSig);
      
      if (pairEvent) {
        const pairAddress = ethers.getAddress('0x' + pairEvent.data.slice(26, 66));
        console.log('Pair address:', pairAddress);
      }
      
      console.log('https://explorer.execution.mainnet.lukso.network/tx/' + TX_HASH);
    }
  } else {
    console.log('⏳ Pending...');
  }
}

check();