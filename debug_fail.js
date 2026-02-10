const { ethers } = require('ethers');

const TX = '0xc8a95bb255872c535658773070c34157f3664042e6b9a073c8bfcf74822c5fe5';

async function debug() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const tx = await provider.getTransaction(TX);
  console.log('Transaction:', TX);
  console.log('To:', tx?.to);
  console.log('From:', tx?.from);
  console.log('Data length:', tx?.data?.length);
  
  // Try to get revert reason
  try {
    await provider.call({
      to: tx.to,
      from: tx.from,
      data: tx.data,
      value: tx.value
    });
  } catch (e) {
    console.log('Revert reason:', e.message);
  }
}

debug();
