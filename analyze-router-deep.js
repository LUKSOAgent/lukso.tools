const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const ROUTER = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';

async function analyzeRouter() {
  console.log('🔍 Deep Router Analysis\n');
  
  const code = await provider.getCode(ROUTER);
  console.log('Router code length:', code.length);
  console.log('Router has code:', code.length > 2 ? '✅ Yes' : '❌ No');
  console.log('');
  
  // Check for different function signatures
  const signatures = [
    'addLiquidityETH(address,uint256,uint256,uint256,address,uint256)',
    'addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)',
    'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
    'swapExactETHForTokens(uint256,address[],address,uint256)',
    'factory()',
    'WETH9()',
    'WLYX()'
  ];
  
  console.log('Function Signatures:');
  for (const sig of signatures) {
    const selector = ethers.id(sig).slice(0, 10);
    const exists = code.includes(selector.slice(2));
    console.log(`${exists ? '✅' : '❌'} ${sig}`);
  }
  
  console.log('\n🔍 Checking Router on Explorer...');
  console.log('https://explorer.execution.mainnet.lukso.network/address/' + ROUTER);
  
  // Check if this is actually the right router
  console.log('\n📚 From GitHub Repo Analysis:');
  console.log('- Universal Swaps uses Uniswap V3 style architecture');
  console.log('- Router is for swapping, not for adding liquidity');
  console.log('- For adding liquidity, use NonfungiblePositionManager.mint()');
  console.log('- The "Router" might just be the swap router, not liquidity router');
  
  console.log('\n⚠️  POSSIBLE ISSUE:');
  console.log('This Router contract might only be for swaps, not liquidity!');
  console.log('We may need the NonfungiblePositionManager address instead.');
}

analyzeRouter();