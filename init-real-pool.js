const { ethers } = require('ethers');
const fs = require('fs');

const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const POOL = '0xa9c6d432f54a94feff69aab33f763c3be898118a';

const POOL_ABI = [
  'function initialize(uint160 sqrtPriceX96) external',
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
];

async function initializePool() {
  console.log('🚀 Initializing Pool\n');
  console.log('Pool:', POOL);
  console.log('');
  
  const pool = new ethers.Contract(POOL, POOL_ABI, wallet);
  
  // Check if already initialized
  try {
    const slot0 = await pool.slot0();
    console.log('sqrtPriceX96:', slot0.sqrtPriceX96.toString());
    if (slot0.sqrtPriceX96 > 0) {
      console.log('Pool already initialized!');
      return;
    }
  } catch (e) {
    console.log('Pool not initialized yet');
  }
  
  console.log('');
  
  // Set initial price: 1 AGENTPO = 0.001 WLYX
  const price = 0.001;
  const sqrtPrice = Math.sqrt(price);
  const sqrtPriceX96 = BigInt(Math.floor(sqrtPrice * 2**96));
  
  console.log('Initial price: 1 AGENTPO = 0.001 WLYX');
  console.log('sqrtPriceX96:', sqrtPriceX96.toString());
  console.log('');
  
  const tx = await pool.initialize(sqrtPriceX96, { gasLimit: 500000 });
  console.log('Tx:', tx.hash);
  
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log('\n✅ Pool initialized!');
    console.log('https://explorer.execution.mainnet.lukso.network/tx/' + tx.hash);
    console.log('\n🎉 Ready for liquidity!');
  } else {
    console.log('\n❌ Failed');
  }
}

initializePool().catch(err => console.error('❌', err.message));