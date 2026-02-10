const { ethers } = require('ethers');

const walletAddress = '0x899C7642802E294857b19754a2377F8e74dA9319';
const LUKSO_TOKEN = '0x81040cfd2bb62062525d958aD01931988a590B07';

const provider = new ethers.JsonRpcProvider('https://base.publicnode.com');

// Try to find any pools for this token
const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)"
];

const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
];

// Uniswap V2 Factory on Base
const UNISWAP_V2_FACTORY = '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6';
// SushiSwap Factory on Base
const SUSHISWAP_FACTORY = '0x71524B4f93c58fcbF659783284E38825f0622859';

const WETH = '0x4200000000000000000000000000000000000006';
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913';

async function findPools() {
  console.log('Searching for LUKSO pools...\n');
  
  // Check Uniswap V2
  try {
    const uniFactory = new ethers.Contract(UNISWAP_V2_FACTORY, FACTORY_ABI, provider);
    const pair1 = await uniFactory.getPair(LUKSO_TOKEN, WETH);
    console.log('Uniswap V2 LUKSO/WETH:', pair1);
    
    if (pair1 !== '0x0000000000000000000000000000000000000000') {
      const pair = new ethers.Contract(pair1, PAIR_ABI, provider);
      const reserves = await pair.getReserves();
      console.log('  Reserves:', reserves[0].toString(), reserves[1].toString());
    }
    
    const pair2 = await uniFactory.getPair(LUKSO_TOKEN, USDC);
    console.log('Uniswap V2 LUKSO/USDC:', pair2);
  } catch(e) {
    console.log('Uniswap V2 error:', e.message);
  }
  
  // Check SushiSwap
  try {
    const sushiFactory = new ethers.Contract(SUSHISWAP_FACTORY, FACTORY_ABI, provider);
    const pair3 = await sushiFactory.getPair(LUKSO_TOKEN, WETH);
    console.log('\nSushiSwap LUKSO/WETH:', pair3);
  } catch(e) {
    console.log('SushiSwap error:', e.message);
  }
}

findPools();
