const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const FACTORY = '0xB718886a34595C09ff5437875079E8ff2365c6E6';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const WLYX = '0x6b6F4cb50e67adb082300b90Af49AF499D41d04E';

// Existing pair from Jordy
const EXISTING_PAIR = '0xB9ddaE8a609167472549f7A68425c47Dba3515EC';

async function checkPairs() {
  console.log('🔍 Checking for AGENTPO/WLYX Pair\n');
  
  // Try both orderings
  const factoryAbi = ['function getPair(address,address) view returns (address)'];
  const factory = new ethers.Contract(FACTORY, factoryAbi, provider);
  
  console.log('Checking AGENTPO + WLYX:');
  const pair1 = await factory.getPair(AGENTPO, WLYX);
  console.log('  Result:', pair1);
  console.log('  Exists:', pair1 !== '0x0000000000000000000000000000000000000000' ? '✅ YES' : '❌ No');
  
  console.log('');
  console.log('Checking WLYX + AGENTPO:');
  const pair2 = await factory.getPair(WLYX, AGENTPO);
  console.log('  Result:', pair2);
  console.log('  Exists:', pair2 !== '0x0000000000000000000000000000000000000000' ? '✅ YES' : '❌ No');
  
  console.log('');
  console.log('📊 Analysis of existing pair (from Jordy):');
  console.log('  Address:', EXISTING_PAIR);
  
  const pairAbi = [
    'function token0() view returns (address)',
    'function token1() view returns (address)',
    'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function factory() view returns (address)'
  ];
  
  const pair = new ethers.Contract(EXISTING_PAIR, pairAbi, provider);
  
  try {
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    const reserves = await pair.getReserves();
    const pairFactory = await pair.factory();
    
    console.log('  Factory:', pairFactory);
    console.log('  Token0:', token0);
    console.log('  Token1:', token1);
    console.log('  Reserve0:', ethers.formatEther(reserves.reserve0));
    console.log('  Reserve1:', ethers.formatEther(reserves.reserve1));
    
    console.log('');
    console.log('✅ This proves the system works!');
    console.log('');
    console.log('Next step: Create AGENTPO/WLYX pair');
    console.log('  Factory:', FACTORY);
    console.log('  Token A:', AGENTPO);
    console.log('  Token B:', WLYX);
    
  } catch (e) {
    console.log('  Error reading pair:', e.message);
  }
}

checkPairs();