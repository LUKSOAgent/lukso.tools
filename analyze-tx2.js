const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

const TX_HASH = '0x91d6f872b121188dc858c0179c52d569b3d6ef32179f7c3c2a85acf73f3d95e1';

async function analyzeTx() {
  const tx = await provider.getTransaction(TX_HASH);
  
  // Try to decode as simple deposit
  const iface = new ethers.Interface([
    "function deposit(address receiver, address referrer) external payable returns (uint256 shares)"
  ]);
  
  try {
    const decoded = iface.decodeFunctionData('deposit', tx.data);
    console.log('Decoded as deposit():');
    console.log('Receiver:', decoded[0]);
    console.log('Referrer:', decoded[1]);
  } catch (e) {
    console.log('Not deposit:', e.message);
  }
  
  // Check if the vault state was already updated before this tx
  console.log('\nTransaction was at block:', tx.blockNumber);
  console.log('Value:', ethers.formatEther(tx.value), 'ETH');
  
  // Get block timestamp
  const block = await provider.getBlock(tx.blockNumber);
  console.log('Timestamp:', new Date(block.timestamp * 1000).toISOString());
}

analyzeTx().catch(console.error);
