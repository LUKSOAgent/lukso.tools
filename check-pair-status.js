const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const ROUTER = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';
const WLYX = '0x6b6F4cb50e67adb082300b90Af49AF499D41d04E';

async function checkPair() {
  console.log('🔍 Checking Pair Status\n');
  
  // Get pair address
  const factoryAbi = ['function getPair(address,address) view returns (address)'];
  const factory = new ethers.Contract('0xf9bafd57e49a8cb38465414e4a84560b10ee40e3', factoryAbi, provider);
  
  const pair = await factory.getPair(AGENTPO, WLYX);
  console.log('Pair Address:', pair);
  
  if (pair === '0x0000000000000000000000000000000000000000') {
    console.log('❌ Pair does not exist!');
    return;
  }
  
  console.log('✅ Pair exists');
  
  // Check pair code
  const code = await provider.getCode(pair);
  console.log('Pair has code:', code.length > 2 ? '✅ Yes' : '❌ No');
  
  // Check pair reserves
  const pairAbi = [
    'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function token0() view returns (address)',
    'function token1() view returns (address)'
  ];
  
  const pairContract = new ethers.Contract(pair, pairAbi, provider);
  
  try {
    const token0 = await pairContract.token0();
    const token1 = await pairContract.token1();
    console.log('Token0:', token0);
    console.log('Token1:', token1);
    
    const reserves = await pairContract.getReserves();
    console.log('Reserve0:', ethers.formatEther(reserves.reserve0));
    console.log('Reserve1:', ethers.formatEther(reserves.reserve1));
    
    if (reserves.reserve0 === 0n && reserves.reserve1 === 0n) {
      console.log('\n⚠️  Pair exists but has NO RESERVES!');
      console.log('This is expected for a newly created pair.');
    }
  } catch (e) {
    console.log('Error reading pair:', e.message);
  }
  
  console.log('');
  console.log('📊 Summary:');
  console.log('- Pair created: ✅');
  console.log('- Needs liquidity: ✅');
  console.log('- My setup: Controller has AGENTPO, Router authorized');
  console.log('');
  console.log('🤔 Why did it fail?');
  console.log('Possible reasons:');
  console.log('1. The pair needs to be initialized with a price first');
  console.log('2. First liquidity addition has different requirements');
  console.log('3. The Router checks something specific that fails');
}

checkPair().catch(console.error);