const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const ROUTER_ADDRESS = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';

// Common router function signatures
const POSSIBLE_ADD_LIQUIDITY = [
  'addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)',
  'addLiquidityLYX(address,uint256,uint256,uint256,address,uint256)',
  'addLiquidityETH(address,uint256,uint256,uint256,address,uint256)'
];

async function checkRouter() {
  console.log('Checking Universal Swaps Router...\n');
  console.log('Router:', ROUTER_ADDRESS);
  console.log('');
  
  // Get bytecode
  const code = await provider.getCode(ROUTER_ADDRESS);
  console.log('Contract deployed:', code.length > 2 ? '✅ Yes' : '❌ No');
  console.log('Bytecode length:', code.length);
  console.log('');
  
  // Check for function signatures
  console.log('Checking function signatures...');
  for (const sig of POSSIBLE_ADD_LIQUIDITY) {
    const selector = ethers.id(sig).slice(0, 10);
    const exists = code.includes(selector.slice(2));
    console.log(`${exists ? '✅' : '❌'} ${sig}`);
    console.log(`   Selector: ${selector}`);
  }
  
  // Also check what WLYX address is
  console.log('\n🔍 Need to find:');
  console.log('1. WLYX contract address (wrapped LYX)');
  console.log('2. Factory address');
  console.log('3. Correct addLiquidity function for LSP7');
}

checkRouter();