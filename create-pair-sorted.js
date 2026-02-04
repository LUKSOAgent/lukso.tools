const { ethers } = require('ethers');
const fs = require('fs');

const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const FACTORY = '0xB718886a34595C09ff5437875079E8ff2365c6E6';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const WLYX = '0x6b6F4cb50e67adb082300b90Af49AF499D41d04E';

const FACTORY_ABI = [
  'function createPair(address tokenA, address tokenB) returns (address pair)',
  'function getPair(address tokenA, address tokenB) view returns (address pair)'
];

async function createPairSorted() {
  console.log('🔨 Creating Pair with Correct Ordering\n');
  
  // Uniswap V2 requires tokens to be sorted: token0 < token1
  const tokenA = AGENTPO.toLowerCase() < WLYX.toLowerCase() ? AGENTPO : WLYX;
  const tokenB = AGENTPO.toLowerCase() < WLYX.toLowerCase() ? WLYX : AGENTPO;
  
  console.log('Token A (token0):', tokenA);
  console.log('Token B (token1):', tokenB);
  console.log('');
  console.log('AGENTPO < WLYX?', AGENTPO.toLowerCase() < WLYX.toLowerCase());
  console.log('');
  
  const factory = new ethers.Contract(FACTORY, FACTORY_ABI, wallet);
  
  // Check if pair already exists
  const existingPair = await factory.getPair(tokenA, tokenB);
  if (existingPair !== '0x0000000000000000000000000000000000000000') {
    console.log('✅ Pair already exists:', existingPair);
    return existingPair;
  }
  
  console.log('Creating pair with sorted tokens...\n');
  
  try {
    const tx = await factory.createPair(tokenA, tokenB, {
      gasLimit: 500000
    });
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...\n');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ Pair created successfully!');
      console.log('Gas used:', receipt.gasUsed.toString());
      console.log('Block:', receipt.blockNumber);
      
      const newPair = await factory.getPair(tokenA, tokenB);
      console.log('🎉 New pair address:', newPair);
      return newPair;
    } else {
      console.log('❌ Transaction failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.data) console.log('Error data:', error.data);
    
    console.log('');
    console.log('📋 Possible reasons for failure:');
    console.log('1. Factory has access control (only owner can create)');
    console.log('2. Token validation failed');
    console.log('3. Gas limit too low');
    console.log('4. Factory is paused');
  }
}

createPairSorted();