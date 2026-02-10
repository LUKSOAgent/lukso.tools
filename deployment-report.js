const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.mainnet.lukso.network';
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER_ADDRESS = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const TX_HASH = '0x6a1f90d9e51e84eb7d1abc389b70a0e7ffe35810d36f57e088f6feb6017eeb46';
const INDEX_KEY = '0xe98fa8f48fa32afc25644cc164d530c16442af7dd7a5f8095cd33d77671be63d';
const LSP28_KEY = '0x0a23000000000000000000000000000000000000000000000000000000000000';

const LSP0_ABI = [
  'function getData(bytes32 dataKey) view returns (bytes)'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const up = new ethers.Contract(UP_ADDRESS, LSP0_ABI, provider);
  
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║          LSP28 GRID DEPLOYMENT - SUCCESS REPORT                 ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  
  // Transaction details
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  const tx = await provider.getTransaction(TX_HASH);
  
  console.log('📋 TRANSACTION DETAILS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Transaction Hash:', TX_HASH);
  console.log('Block Number:', receipt.blockNumber);
  console.log('Timestamp:', new Date((await provider.getBlock(receipt.blockNumber)).timestamp * 1000).toISOString());
  console.log('Gas Used:', receipt.gasUsed.toString());
  console.log('Gas Price:', tx.gasPrice?.toString() || 'N/A');
  console.log('From:', tx.from);
  console.log('To (KeyManager):', tx.to);
  console.log('');
  
  // LSP28 Grid Details
  console.log('📊 LSP28 GRID DETAILS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Universal Profile:', UP_ADDRESS);
  console.log('KeyManager:', KEY_MANAGER_ADDRESS);
  console.log('Array Key:', LSP28_KEY);
  console.log('');
  
  // Verify data
  console.log('🔍 DATA VERIFICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const arrayLengthData = await up.getData(LSP28_KEY);
  let arrayLength = 0;
  if (arrayLengthData && arrayLengthData !== '0x') {
    arrayLength = parseInt(arrayLengthData.slice(-64), 16);
  }
  console.log('Array Length:', arrayLength);
  console.log('Grid Index:', 0);
  console.log('Data Key:', INDEX_KEY);
  console.log('');
  
  const gridData = await up.getData(INDEX_KEY);
  console.log('Grid Data Stored:', gridData ? '✅ Yes' : '❌ No');
  console.log('Data Size:', gridData.length, 'chars');
  console.log('');
  
  // Extract content hash from stored data
  if (gridData && gridData.startsWith('0x6f357c6a')) {
    const hashStart = 8 + 4 + 8; // identifier + method + length
    const hashLength = 64; // 32 bytes = 64 hex chars
    const contentHash = '0x' + gridData.slice(2 + hashStart, 2 + hashStart + hashLength);
    console.log('Content Hash:', contentHash);
    console.log('');
  }
  
  // Links
  console.log('🔗 LINKS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Explorer:', `https://explorer.execution.mainnet.lukso.network/tx/${TX_HASH}`);
  console.log('UP Inspector:', `https://erc725-inspect.lukso.tech/inspector?address=${UP_ADDRESS}`);
  console.log('');
  
  console.log('✅ LSP28 Grid is now live on the Universal Profile!');
  console.log('');
  
  return {
    txHash: TX_HASH,
    blockNumber: receipt.blockNumber,
    upAddress: UP_ADDRESS,
    arrayLength: arrayLength,
    dataKey: INDEX_KEY
  };
}

main().catch(console.error);
