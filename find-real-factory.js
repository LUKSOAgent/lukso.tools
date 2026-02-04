const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const ROUTER = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';

async function findFactory() {
  console.log('🔍 Finding Correct Factory Address\n');
  
  // Try to call factory() on the Router
  const routerAbi = ['function factory() view returns (address)'];
  const router = new ethers.Contract(ROUTER, routerAbi, provider);
  
  try {
    const factory = await router.factory();
    console.log('✅ Router.factory():', factory);
    
    // Check if factory has code
    const code = await provider.getCode(factory);
    console.log('Factory code length:', code.length);
    console.log('Factory has code:', code.length > 2 ? '✅ Yes' : '❌ No');
    
    if (code.length > 2) {
      console.log('\n✅ FOUND the correct factory!');
      console.log('Address:', factory);
    }
  } catch (e) {
    console.log('❌ Router does not have factory() method');
    console.log('Error:', e.message);
  }
  
  console.log('');
  console.log('📋 Previous attempts:');
  console.log('  0xf9bafd57e49a8cb38465414e4a84560b10ee40e3 - ❌ No code (wrong address)');
  console.log('');
  console.log('💡 Lesson learned:');
  console.log('Always verify contract addresses before using them!');
}

findFactory();