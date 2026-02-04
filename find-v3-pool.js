const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const PM = '0x855bb3e40261a73dd4fc691fc024cc7d60794d00';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const WLYX = '0x6b6F4cb50e67adb082300b90Af49AF499D41d04E';

const PM_ABI = [
  'function factory() view returns (address)',
  'function WETH9() view returns (address)'
];

const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)'
];

const POOL_ABI = [
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() view returns (uint128)',
  'function token0() view returns (address)',
  'function token1() view returns (address)'
];

async function findPool() {
  console.log('🔍 Finding AGENTPO/WLYX Pool\n');
  
  const pm = new ethers.Contract(PM, PM_ABI, provider);
  const factory = await pm.factory();
  const weth9 = await pm.WETH9();
  
  console.log('Position Manager:', PM);
  console.log('Factory:', factory);
  console.log('WETH9/WLYX:', weth9);
  console.log('');
  
  const factoryContract = new ethers.Contract(factory, FACTORY_ABI, provider);
  
  // Check different fee tiers
  const fees = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
  
  for (const fee of fees) {
    const pool = await factoryContract.getPool(AGENTPO, WLYX, fee);
    console.log(`Pool (fee ${fee}):`, pool);
    
    if (pool !== '0x0000000000000000000000000000000000000000') {
      console.log('  ✅ EXISTS!');
      
      const poolContract = new ethers.Contract(pool, POOL_ABI, provider);
      try {
        const slot0 = await poolContract.slot0();
        const liquidity = await poolContract.liquidity();
        const token0 = await poolContract.token0();
        const token1 = await poolContract.token1();
        
        console.log('  Token0:', token0);
        console.log('  Token1:', token1);
        console.log('  SqrtPriceX96:', slot0.sqrtPriceX96.toString());
        console.log('  Tick:', slot0.tick);
        console.log('  Liquidity:', liquidity.toString());
        console.log('  Unlocked:', slot0.unlocked);
        
        if (liquidity > 0) {
          console.log('  🎉 POOL HAS LIQUIDITY!');
        } else {
          console.log('  ⚠️ Pool exists but no liquidity yet');
        }
      } catch (e) {
        console.log('  Error reading pool:', e.message);
      }
    }
    console.log('');
  }
  
  console.log('📋 Summary:');
  console.log('- Check which fee tier pool exists');
  console.log('- Use that fee tier when adding liquidity');
}

findPool().catch(console.error);