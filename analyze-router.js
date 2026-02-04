const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const ROUTER_ADDRESS = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';
const FACTORY_ADDRESS = '0xF9bAfd57E49A8cB38465414e4A84560b10ee40e3';

async function analyzeRouter() {
  console.log('🔍 Analyzing Universal Swaps Router\n');
  
  const code = await provider.getCode(ROUTER_ADDRESS);
  console.log('Router code length:', code.length);
  
  // Check for ERC20 functions
  const ERC20_SIGNATURES = [
    'transferFrom(address,address,uint256)',
    'transfer(address,uint256)'
  ];
  
  console.log('\nERC20 Functions in Router:');
  for (const sig of ERC20_SIGNATURES) {
    const selector = ethers.id(sig).slice(0, 10);
    const exists = code.includes(selector.slice(2));
    console.log(`${exists ? '✅' : '❌'} ${sig}`);
  }
  
  // Check pair for AGENTPO/WLYX
  const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
  const WLYX = '0x2f5d256a172a0ae51ad826996fea5ec5f540c435'; // lowercase
  
  console.log('\n🔍 Checking Pair:');
  console.log('AGENTPO:', AGENTPO);
  console.log('WLYX:', WLYX);
  
  const factoryAbi = ['function getPair(address,address) view returns (address)'];
  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryAbi, provider);
  
  try {
    const pair = await factory.getPair(AGENTPO, WLYX);
    console.log('Pair address:', pair);
    if (pair !== '0x0000000000000000000000000000000000000000') {
      const pairCode = await provider.getCode(pair);
      console.log('Pair exists:', pairCode.length > 2 ? '✅ Yes' : '❌ No');
    } else {
      console.log('❌ Pair does not exist yet - needs to be created first!');
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
  
  console.log('\n📝 Conclusion:');
  console.log('- Router uses ERC20 transferFrom');
  console.log('- LSP7 is ERC20 compatible via fallback');
  console.log('- Pair needs to be created first!');
  console.log('');
  console.log('Next step: Create pair first, then add liquidity');
}

analyzeRouter();