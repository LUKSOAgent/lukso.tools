const { ethers } = require('ethers');
const fs = require('fs');

const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const FACTORY = '0xB718886a34595C09ff5437875079E8ff2365c6E6';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const WLYX = '0x6b6F4cb50e67adb082300b90Af49AF499D41d04E';

const FACTORY_ABI = [
  'function createPair(address tokenA, address tokenB) returns (address pair)',
  'function getPair(address tokenA, address tokenB) view returns (address pair)'
];

async function createRealPair() {
  console.log('🔨 Creating Real AGENTPO/WLYX Pair\n');
  console.log('Factory:', FACTORY);
  console.log('Token A (AGENTPO):', AGENTPO);
  console.log('Token B (WLYX):', WLYX);
  console.log('');
  
  const factory = new ethers.Contract(FACTORY, FACTORY_ABI, wallet);
  
  // Check if pair already exists
  const existingPair = await factory.getPair(AGENTPO, WLYX);
  if (existingPair !== '0x0000000000000000000000000000000000000000') {
    console.log('✅ Pair already exists:', existingPair);
    return existingPair;
  }
  
  console.log('Creating pair...\n');
  
  const tx = await factory.createPair(AGENTPO, WLYX, {
    gasLimit: 500000
  });
  
  console.log('Transaction sent:', tx.hash);
  console.log('Waiting for confirmation...\n');
  
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log('✅ Pair created successfully!');
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Block:', receipt.blockNumber);
    console.log('');
    
    // Find PairCreated event
    const pairCreatedTopic = ethers.id('PairCreated(address,address,address,uint256)');
    const pairEvent = receipt.logs.find(log => 
      log.topics[0] === pairCreatedTopic
    );
    
    if (pairEvent) {
      // Decode the pair address from the event
      const pairAddress = ethers.getAddress('0x' + pairEvent.topics[3].slice(26));
      console.log('🎉 New pair address:', pairAddress);
      return pairAddress;
    }
    
    // If we can't find the event, query the factory
    const newPair = await factory.getPair(AGENTPO, WLYX);
    console.log('🎉 New pair address:', newPair);
    return newPair;
  } else {
    console.log('❌ Transaction failed');
    return null;
  }
}

createRealPair().catch(err => {
  console.error('❌ Error:', err.message);
});