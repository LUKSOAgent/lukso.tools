const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TARGET_CONTRACT = '0x4f95606AA863ba1FDfd4E14d6050BDe4fA38B058';
const TX_HASH = '0x39933f4e5e16802b446dbaf22ed1b4c42c52744084559b10fa7a6f4c4192d73e';

async function decodeTransaction() {
  console.log('🔍 Decoding Transaction\n');
  
  const tx = await provider.getTransaction(TX_HASH);
  
  console.log('Transaction Data:', tx.data);
  console.log('');
  
  // Extract function selector
  const selector = tx.data.slice(0, 10);
  console.log('Function Selector:', selector);
  console.log('');
  
  // Common Forever Moments function signatures
  const signatures = [
    'mintMoment(address,bytes,address)',
    'mintMoment(address,bytes)',
    'createMoment(address,bytes,address)',
    'mint(address,bytes)',
    'createMoment(bytes)',
    'mintCollectionMoment(address,bytes)',
    'addMoment(address,bytes,address)',
    'createAndMintMoment(address,bytes,address)'
  ];
  
  console.log('Possible function matches:');
  for (const sig of signatures) {
    const hash = ethers.id(sig).slice(0, 10);
    const match = hash === selector;
    console.log(`  ${match ? '✅' : '  '} ${sig} => ${hash}`);
  }
  
  console.log('');
  
  // Try to decode manually
  // The data after selector
  const dataAfterSelector = tx.data.slice(10);
  console.log('Data after selector length:', dataAfterSelector.length, 'hex chars');
  console.log('');
  
  // Parse as abi.decode would
  // For mintMoment(address,bytes,address):
  // - First 32 bytes: offset to bytes param
  // - Next 32 bytes: address (collection)
  // - Then bytes data
  
  const word1 = '0x' + dataAfterSelector.slice(0, 64); // offset to bytes
  const word2 = '0x' + dataAfterSelector.slice(64, 128); // collection address
  const word3 = '0x' + dataAfterSelector.slice(128, 192); // ???
  
  console.log('Word 1 (offset to bytes):', word1);
  console.log('Word 2:', word2);
  console.log('Word 3:', word3);
  console.log('');
  
  // Decode collection address from word2
  const collectionFromData = '0x' + word2.slice(-40);
  console.log('Collection from data:', collectionFromData);
  console.log('');
  
  // Check if target contract is the collection registry
  const REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
  console.log('Is target the registry?:', TARGET_CONTRACT.toLowerCase() === REGISTRY.toLowerCase());
  console.log('Registry:', REGISTRY);
}

decodeTransaction().catch(console.error);