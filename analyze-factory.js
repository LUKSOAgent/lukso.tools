const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const FACTORY = '0xB718886a34595C09ff5437875079E8ff2365c6E6';

async function analyzeFactory() {
  console.log('🔍 Analyzing Factory Contract\n');
  
  const factoryAbi = [
    'function feeTo() view returns (address)',
    'function feeToSetter() view returns (address)',
    'function getPair(address,address) view returns (address)',
    'function allPairs(uint) view returns (address)',
    'function allPairsLength() view returns (uint)'
  ];
  
  const factory = new ethers.Contract(FACTORY, factoryAbi, provider);
  
  try {
    const feeTo = await factory.feeTo();
    const feeToSetter = await factory.feeToSetter();
    const allPairsLength = await factory.allPairsLength();
    
    console.log('Factory Info:');
    console.log('  Fee To:', feeTo);
    console.log('  Fee To Setter:', feeToSetter);
    console.log('  Total Pairs:', allPairsLength.toString());
    console.log('');
    
    // Get a few recent pairs
    console.log('Recent Pairs:');
    const start = Number(allPairsLength) > 5 ? Number(allPairsLength) - 5 : 0;
    for (let i = start; i < Number(allPairsLength); i++) {
      try {
        const pair = await factory.allPairs(i);
        console.log(`  ${i}: ${pair}`);
      } catch (e) {
        console.log(`  ${i}: Error fetching`);
      }
    }
    
    console.log('');
    console.log('📋 Factory Analysis:');
    console.log('- Factory is a standard Uniswap V2 factory');
    console.log('- Has', allPairsLength.toString(), 'pairs created');
    console.log('- Fee mechanism exists');
    console.log('');
    console.log('💡 Possible issue:');
    console.log('The factory might require specific conditions for pair creation');
    console.log('Or there might be a transaction ordering issue');
    
  } catch (e) {
    console.log('Error:', e.message);
  }
}

analyzeFactory();