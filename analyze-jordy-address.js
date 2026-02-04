const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const ADDRESS = '0xB9ddaE8a609167472549f7A68425c47Dba3515EC';

async function analyze() {
  console.log('🔍 Analyzing Address:', ADDRESS);
  console.log('=====================================\n');
  
  // Check if it has code
  const code = await provider.getCode(ADDRESS);
  console.log('Has code:', code.length > 2 ? '✅ Yes (' + code.length + ' bytes)' : '❌ No');
  console.log('');
  
  if (code.length <= 2) {
    console.log('This is an EOA (wallet), not a contract');
    return;
  }
  
  // Try to identify what type of contract this is
  // Check for common function signatures
  const signatures = {
    // Uniswap V2 Pair
    'getReserves()': '0x0902f1ac',
    'token0()': '0x0dfe1681',
    'token1()': '0xd21220a7',
    
    // Uniswap V3 PositionManager
    'mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))': '0x88316456',
    'positions(uint256)': '0x99fbab88',
    
    // Router
    'addLiquidityETH(address,uint256,uint256,uint256,address,uint256)': '0xf305d719',
    'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)': '0x472b43f3',
    
    // Factory
    'createPair(address,address)': '0xc9c65396',
    'getPair(address,address)': '0xe6a43905'
  };
  
  console.log('Checking function signatures:');
  for (const [name, selector] of Object.entries(signatures)) {
    const hasSig = code.includes(selector.slice(2));
    if (hasSig) {
      console.log(`  ✅ ${name}`);
    }
  }
  
  console.log('');
  
  // Try to call some common functions
  const pairAbi = [
    'function token0() view returns (address)',
    'function token1() view returns (address)',
    'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'
  ];
  
  const pmAbi = [
    'function factory() view returns (address)',
    'function WETH9() view returns (address)'
  ];
  
  // Try as Pair
  console.log('Trying as Pair...');
  const pair = new ethers.Contract(ADDRESS, pairAbi, provider);
  try {
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    const reserves = await pair.getReserves();
    
    console.log('  ✅ This is a PAIR!');
    console.log('  Token0:', token0);
    console.log('  Token1:', token1);
    console.log('  Reserve0:', ethers.formatEther(reserves.reserve0));
    console.log('  Reserve1:', ethers.formatEther(reserves.reserve1));
    return;
  } catch (e) {
    console.log('  Not a pair');
  }
  
  // Try as PositionManager
  console.log('Trying as PositionManager...');
  const pm = new ethers.Contract(ADDRESS, pmAbi, provider);
  try {
    const factory = await pm.factory();
    const weth = await pm.WETH9();
    
    console.log('  ✅ This is a POSITION MANAGER!');
    console.log('  Factory:', factory);
    console.log('  WETH9:', weth);
    return;
  } catch (e) {
    console.log('  Not a PositionManager');
  }
  
  console.log('');
  console.log('Could not identify contract type automatically');
  console.log('Check on explorer:');
  console.log('https://explorer.execution.mainnet.lukso.network/address/' + ADDRESS);
}

analyze().catch(console.error);