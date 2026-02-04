const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const FACTORY_ADDRESS = '0xf9bafd57e49a8cb38465414e4a84560b10ee40e3'; // lowercase
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const WLYX = '0x2f5d256a172a0ae51ad826996fea5ec5f540c435';

async function checkPair() {
  console.log('🔍 Checking Pair Status\n');
  
  const factoryAbi = ['function getPair(address,address) view returns (address)'];
  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryAbi, provider);
  
  try {
    const pair = await factory.getPair(AGENTPO, WLYX);
    console.log('Pair address:', pair);
    
    if (pair === '0x0000000000000000000000000000000000000000') {
      console.log('❌ Pair does NOT exist');
      console.log('');
      console.log('⚠️  Need to create pair first via Factory.createPair()');
    } else {
      console.log('✅ Pair exists:', pair);
      const pairCode = await provider.getCode(pair);
      console.log('Pair has code:', pairCode.length > 2);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

checkPair();