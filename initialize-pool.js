const { ethers } = require('ethers');
const fs = require('fs');

const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const POOL = '0x0000000000000000000000000000000000000bb8';

const POOL_ABI = [
  'function initialize(uint160 sqrtPriceX96) external',
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
];

async function initializePool() {
  console.log('🚀 Initializing Pool\n');
  console.log('Pool:', POOL);
  console.log('');
  
  const pool = new ethers.Contract(POOL, POOL_ABI, wallet);
  
  // Check current state
  try {
    const slot0 = await pool.slot0();
    console.log('Current sqrtPriceX96:', slot0.sqrtPriceX96.toString());
    console.log('Already initialized:', slot0.sqrtPriceX96 > 0 ? 'Yes' : 'No');
    
    if (slot0.sqrtPriceX96 > 0) {
      console.log('Pool already initialized!');
      return;
    }
  } catch (e) {
    console.log('Could not read slot0:', e.message);
  }
  
  console.log('');
  
  // Calculate initial price
  // Let's set initial price so that 1 AGENTPO = 0.001 WLYX
  // price = 0.001 = 1/1000
  // sqrtPriceX96 = sqrt(price) * 2^96
  
  const price = 0.001; // 1 AGENTPO = 0.001 WLYX
  const sqrtPrice = Math.sqrt(price);
  const sqrtPriceX96 = BigInt(Math.floor(sqrtPrice * 2**96));
  
  console.log('Setting initial price:');
  console.log('  1 AGENTPO =', price, 'WLYX');
  console.log('  sqrtPriceX96:', sqrtPriceX96.toString());
  console.log('');
  
  try {
    const tx = await pool.initialize(sqrtPriceX96, { gasLimit: 500000 });
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting...\n');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ Pool initialized!');
      console.log('Gas used:', receipt.gasUsed.toString());
      console.log('');
      console.log('Next: Add liquidity!');
    } else {
      console.log('❌ Failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

initializePool();