const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const ROUTER = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';

async function findWLYX() {
  console.log('🔍 Finding WLYX Address\n');
  
  // Try to call WETH() on router
  const routerAbi = ['function WETH() view returns (address)'];
  const routerContract = new ethers.Contract(ROUTER, routerAbi, provider);
  
  try {
    const weth = await routerContract.WETH();
    console.log('✅ Router.WETH():', weth);
    
    // Check if it has code
    const code = await provider.getCode(weth);
    console.log('Has code:', code.length > 2 ? '✅ Yes' : '❌ No');
  } catch (e) {
    console.log('❌ Router does not have WETH() function');
    console.log('Error:', e.message);
  }
}

findWLYX();