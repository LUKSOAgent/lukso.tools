const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TX_HASH = '0x81195750a4ec859286f91e95b2b9697cd35513081da314aed05a4c5b10b0b2c0';

async function analyzeTx() {
  console.log('🔍 Analyzing Example Liquidity Transaction\n');
  
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  const tx = await provider.getTransaction(TX_HASH);
  
  console.log('Transaction Hash:', TX_HASH);
  console.log('From:', tx.from);
  console.log('To:', tx.to);
  console.log('Value:', ethers.formatEther(tx.value), 'LYX');
  console.log('Gas used:', receipt.gasUsed.toString());
  console.log('Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('');
  
  console.log('Input Data:');
  console.log(tx.data.substring(0, 200) + '...');
  console.log('Length:', tx.data.length, 'chars');
  console.log('');
  
  // Decode the data
  console.log('Logs:', receipt.logs.length);
  
  // Check first few bytes for function selector
  const selector = tx.data.substring(0, 10);
  console.log('Function selector:', selector);
  
  // Common selectors
  const selectors = {
    '0x09c5eabe': 'execute(bytes) - KeyManager',
    '0xf305d719': 'addLiquidityETH',
    '0xe8e33700': 'addLiquidity'
  };
  
  console.log('Likely function:', selectors[selector] || 'Unknown');
  
  // If it's KeyManager.execute, decode the inner call
  if (selector === '0x09c5eabe') {
    console.log('\n🔍 This is a KeyManager.execute call');
    console.log('Decoding inner payload...');
    
    // The data after 0x09c5eabe + 64 bytes offset + 32 bytes length
    const innerData = '0x' + tx.data.substring(138);
    console.log('Inner data length:', innerData.length);
    console.log('Inner data:', innerData.substring(0, 100) + '...');
  }
}

analyzeTx();