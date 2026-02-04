const { ethers } = require('ethers');
const fs = require('fs');

// Load credentials
const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

// Addresses
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';

// Universal Swaps contracts
const FACTORY_ADDRESS = '0xf9bafd57e49a8cb38465414e4a84560b10ee40e3';
const ROUTER_ADDRESS = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';
const WLYX = '0x2f5d256a172a0ae51ad826996fea5ec5f540c435';

// ABIs
const FACTORY_ABI = [
  'function createPair(address tokenA, address tokenB) returns (address pair)',
  'function getPair(address tokenA, address tokenB) view returns (address pair)'
];

const UP_ABI = [
  'function execute(uint256 operation, address to, uint256 value, bytes calldata data) returns (bytes memory)'
];

const KEY_MANAGER_ABI = [
  'function execute(bytes calldata payload) returns (bytes memory)'
];

async function createPair() {
  console.log('🔨 Creating AGENTPO/WLYX Pair\n');
  console.log('Factory:', FACTORY_ADDRESS);
  console.log('Token A:', AGENTPO);
  console.log('Token B:', WLYX);
  console.log('');
  
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
  const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  // Encode createPair call
  const createPairData = factory.interface.encodeFunctionData('createPair', [AGENTPO, WLYX]);
  console.log('Create pair calldata:', createPairData.substring(0, 60) + '...');
  
  // Encode UP.execute
  const upExecuteData = up.interface.encodeFunctionData('execute', [
    0, // CALL
    FACTORY_ADDRESS,
    0, // No value needed
    createPairData
  ]);
  
  console.log('Sending transaction...\n');
  
  // Execute via KeyManager
  const tx = await keyManager.execute(upExecuteData, {
    gasLimit: 500000
  });
  
  console.log('Transaction sent:', tx.hash);
  console.log('Waiting for confirmation...');
  
  const receipt = await tx.wait();
  console.log('\n✅ Pair created!');
  console.log('Gas used:', receipt.gasUsed.toString());
  console.log('Block:', receipt.blockNumber);
  console.log('');
  console.log('Explorer:');
  console.log(`https://explorer.execution.mainnet.lukso.network/tx/${tx.hash}`);
  
  // Check for PairCreated event to get the pair address
  const pairCreatedEvent = receipt.logs.find(log => {
    // Topic0 for PairCreated(address,address,address,uint256)
    return log.topics[0] === '0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9';
  });
  
  if (pairCreatedEvent) {
    const pairAddress = ethers.getAddress('0x' + pairCreatedEvent.data.slice(26, 66));
    console.log('');
    console.log('🎉 New pair address:', pairAddress);
  }
  
  return tx.hash;
}

createPair().catch(err => {
  console.error('❌ Error:', err.message);
  if (err.data) console.error('Data:', err.data);
});