const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

// First transaction from memory: 0x76808b86541d707136d540680d0effa5f73a1760dffc95687f095bdc5f429b91
const TX_HASH = '0x76808b86541d707136d540680d0effa5f73a1760dffc95687f095bdc5f429b91';

async function traceTransaction() {
  console.log('Tracing transaction:', TX_HASH);
  console.log('');
  
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  const tx = await provider.getTransaction(TX_HASH);
  
  if (!tx || !receipt) {
    console.log('Transaction not found');
    return;
  }
  
  console.log('Transaction Details:');
  console.log('  From:', tx.from);
  console.log('  To:', tx.to);
  console.log('  Data length:', tx.data.length);
  console.log('  Block:', receipt.blockNumber);
  console.log('  Status:', receipt.status === 1 ? 'Success' : 'Failed');
  console.log('');
  
  // Check if this went through KeyManager
  const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
  
  if (tx.to.toLowerCase() === KEY_MANAGER.toLowerCase()) {
    console.log('Transaction went through KeyManager ✅');
    
    // Decode the execute call
    const LSP6_ABI = ['function execute(bytes calldata payload) payable'];
    const iface = new ethers.Interface(LSP6_ABI);
    
    try {
      const decoded = iface.parseTransaction({ data: tx.data });
      console.log('  Decoded function:', decoded.name);
      console.log('  Payload:', decoded.args.payload);
      console.log('');
      
      // The payload should be UP.execute(...)
      const UP_ABI = ['function execute(uint256 operationType, address target, uint256 value, bytes calldata data)'];
      const upIface = new ethers.Interface(UP_ABI);
      
      try {
        const upDecoded = upIface.parseTransaction({ data: decoded.args.payload });
        console.log('  UP.execute decoded:');
        console.log('    operationType:', upDecoded.args.operationType.toString());
        console.log('    target:', upDecoded.args.target);
        console.log('    value:', upDecoded.args.value.toString());
        console.log('    data:', upDecoded.args.data.slice(0, 100) + '...');
      } catch (e) {
        console.log('  Could not decode UP.execute payload:', e.message);
      }
    } catch (e) {
      console.log('  Could not decode KeyManager call:', e.message);
    }
  } else {
    console.log('Transaction did NOT go through KeyManager');
  }
  
  console.log('');
  console.log('Key insight:');
  console.log('  The "from" address', tx.from, 'is the EOA that submitted the transaction');
  console.log('  This should be the controller address with permissions on the UP');
  
  // Compare with known addresses
  const WALLET_FROM_PK = '0xE093A714960da1bF297522617BfC08132b62B86a';
  const CREDENTIALS_CONTROLLER = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';
  
  console.log('');
  console.log('Address comparison:');
  console.log('  Tx From:', tx.from);
  console.log('  Wallet from PK:', WALLET_FROM_PK);
  console.log('  Credentials Controller:', CREDENTIALS_CONTROLLER);
  console.log('');
  console.log('Tx From matches Wallet from PK:', tx.from.toLowerCase() === WALLET_FROM_PK.toLowerCase() ? '✅ YES' : '❌ NO');
  console.log('Tx From matches Credentials Controller:', tx.from.toLowerCase() === CREDENTIALS_CONTROLLER.toLowerCase() ? '✅ YES' : '❌ NO');
}

traceTransaction().catch(console.error);
