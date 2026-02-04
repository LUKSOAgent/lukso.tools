const { ethers } = require('ethers');
const fs = require('fs');

const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const WLYX = '0x6b6F4cb50e67adb082300b90Af49AF499D41d04E';
const FACTORY = '0x8130C332Dddf8964B08eab86AAD3999017436A6E';

const FACTORY_ABI = [
  'function createPool(address tokenA, address tokenB, uint24 fee) returns (address pool)'
];

async function createPool() {
  console.log('🔨 Creating AGENTPO/WLYX Pool\n');
  console.log('Factory:', FACTORY);
  console.log('Token A:', AGENTPO);
  console.log('Token B:', WLYX);
  console.log('');
  
  const factory = new ethers.Contract(FACTORY, FACTORY_ABI, wallet);
  
  // Create pool with 0.3% fee
  const fee = 3000;
  console.log('Creating pool with fee:', fee / 100, '%');
  console.log('');
  
  try {
    const tx = await factory.createPool(AGENTPO, WLYX, fee, {
      gasLimit: 5000000
    });
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...\n');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ Pool created successfully!');
      console.log('Gas used:', receipt.gasUsed.toString());
      console.log('Block:', receipt.blockNumber);
      
      // Find PoolCreated event
      const poolCreatedTopic = ethers.id('PoolCreated(address,address,uint24,int24,address)');
      const event = receipt.logs.find(log => log.topics[0] === poolCreatedTopic);
      
      if (event) {
        const poolAddress = '0x' + event.topics[3].slice(26);
        console.log('\n🎉 New pool address:', poolAddress);
      }
      
      console.log('\nNext step: Initialize pool with initial price, then add liquidity');
    } else {
      console.log('❌ Transaction failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.data) console.log('Data:', error.data);
  }
}

createPool();