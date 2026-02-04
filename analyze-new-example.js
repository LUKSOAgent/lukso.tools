const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const ADDRESS = '0x05ce285A8ac77710AAfDcbD1B26Cf6af3bD1afAb';

async function analyze() {
  console.log('🔍 Analyzing Example Pool:', ADDRESS);
  console.log('==========================================\n');
  
  // Check if it has code
  const code = await provider.getCode(ADDRESS);
  console.log('Has code:', code.length > 2 ? '✅ Yes (' + code.length + ' bytes)' : '❌ No');
  console.log('');
  
  if (code.length <= 2) {
    console.log('This is an EOA, not a contract');
    return;
  }
  
  // Check for pool/pair signatures
  const signatures = {
    'token0()': '0x0dfe1681',
    'token1()': '0xd21220a7',
    'getReserves()': '0x0902f1ac',
    'factory()': '0xc45a0155',
    'mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))': '0x88316456',
    'positions(uint256)': '0x99fbab88',
    'slot0()': '0x3850c7bd',
    'liquidity()': '0x1a686502'
  };
  
  console.log('Checking function signatures:');
  for (const [name, selector] of Object.entries(signatures)) {
    const hasSig = code.includes(selector.slice(2));
    if (hasSig) {
      console.log(`  ✅ ${name}`);
    }
  }
  
  console.log('');
  
  // Try to identify contract type
  const pairAbi = [
    'function token0() view returns (address)',
    'function token1() view returns (address)',
    'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function factory() view returns (address)'
  ];
  
  const poolAbi = [
    'function token0() view returns (address)',
    'function token1() view returns (address)',
    'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
    'function liquidity() view returns (uint128)',
    'function factory() view returns (address)'
  ];
  
  // Try as V2 Pair
  console.log('Trying as V2 Pair...');
  const pair = new ethers.Contract(ADDRESS, pairAbi, provider);
  try {
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    const reserves = await pair.getReserves();
    const factory = await pair.factory();
    
    console.log('  ✅ This is a V2 PAIR!');
    console.log('  Factory:', factory);
    console.log('  Token0:', token0);
    console.log('  Token1:', token1);
    console.log('  Reserve0:', ethers.formatEther(reserves.reserve0));
    console.log('  Reserve1:', ethers.formatEther(reserves.reserve1));
    return;
  } catch (e) {
    console.log('  Not a V2 Pair');
  }
  
  // Try as V3 Pool
  console.log('Trying as V3 Pool...');
  const pool = new ethers.Contract(ADDRESS, poolAbi, provider);
  try {
    const token0 = await pool.token0();
    const token1 = await pool.token1();
    const slot0 = await pool.slot0();
    const liquidity = await pool.liquidity();
    const factory = await pool.factory();
    
    console.log('  ✅ This is a V3 POOL!');
    console.log('  Factory:', factory);
    console.log('  Token0:', token0);
    console.log('  Token1:', token1);
    console.log('  SqrtPriceX96:', slot0.sqrtPriceX96.toString());
    console.log('  Tick:', slot0.tick);
    console.log('  Liquidity:', liquidity.toString());
    return;
  } catch (e) {
    console.log('  Not a V3 Pool');
  }
  
  console.log('');
  console.log('Could not identify contract type');
}

analyze().catch(console.error);