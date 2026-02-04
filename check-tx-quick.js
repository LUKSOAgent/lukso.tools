const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

async function checkTx() {
  try {
    const receipt = await provider.getTransactionReceipt('0x9fc211238e485c973d0ba0554114bf05375649bba5743a2582de4c9abf1daecf');
    if (receipt) {
      console.log('Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
      console.log('Gas used:', receipt.gasUsed.toString());
      console.log('Logs:', receipt.logs.length, 'events');
      
      if (receipt.logs.length > 0) {
        console.log('✅ Events emitted - follows successful!');
      }
    } else {
      console.log('⏳ Still pending...');
    }
  } catch (error) {
    console.log('⏳ Not yet mined');
  }
}

checkTx();