const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const FACTORY = '0xB718886a34595C09ff5437875079E8ff2365c6E6';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const WLYX = '0x6b6F4cb50e67adb082300b90Af49AF499D41d04E';

async function findRealPair() {
  console.log('🔍 Finding Real Pair\n');
  
  const factoryAbi = ['function getPair(address,address) view returns (address)'];
  const factory = new ethers.Contract(FACTORY, factoryAbi, provider);
  
  try {
    const pair = await factory.getPair(AGENTPO, WLYX);
    console.log('Pair Address:', pair);
    
    if (pair === '0x0000000000000000000000000000000000000000') {
      console.log('❌ Pair does NOT exist yet');
      console.log('');
      console.log('Next step: Create the pair first!');
    } else {
      console.log('✅ Pair EXISTS!');
      
      const code = await provider.getCode(pair);
      console.log('Has code:', code.length > 2 ? '✅ Yes' : '❌ No');
      
      // Check reserves
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
          console.log('\n✅ Pair ready for liquidity!');
        }
      } catch (e) {
        console.log('Error reading pair:', e.message);
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

findRealPair();