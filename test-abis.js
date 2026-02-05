const { ethers } = require('ethers');
const fs = require('fs');

// Setup provider and wallet
const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

// Addresses
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER_ADDRESS = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';
const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';

// Test different ABI patterns
const TEST_ABIS = [
  // Pattern 1: Simple register with metadata
  ['function registerCollection(address collectionUP, bytes memory metadata)'],
  
  // Pattern 2: With name and symbol
  ['function registerCollection(address collectionUP, string memory name, string memory symbol, bytes memory metadata)'],
  
  // Pattern 3: Create collection (factory pattern)
  ['function createCollection(bytes memory metadata) returns (address)'],
  
  // Pattern 4: Create with name/symbol
  ['function createCollection(string memory name, string memory symbol, bytes memory metadata) returns (address)'],
  
  // Pattern 5: Minimal
  ['function registerCollection(address collectionUP)'],
  
  // Pattern 6: With creator
  ['function registerCollection(address collectionUP, address creator, bytes memory metadata)']
];

async function testABIs() {
  console.log('🧪 Testing Different ABI Patterns\n');
  
  for (let i = 0; i < TEST_ABIS.length; i++) {
    const abi = TEST_ABIS[i];
    console.log(`Pattern ${i + 1}: ${abi[0]}`);
    
    try {
      const contract = new ethers.Contract(COLLECTION_REGISTRY, abi, provider);
      
      // Try to encode the function call to see if it works
      const iface = new ethers.Interface(abi);
      
      // Create test metadata
      const testMetadata = ethers.toUtf8Bytes(JSON.stringify({ test: true }));
      
      // Try to encode
      let data;
      if (abi[0].includes('string memory name')) {
        data = iface.encodeFunctionData('registerCollection', [
          UP_ADDRESS,
          'Test Collection',
          'TEST',
          testMetadata
        ]);
      } else if (abi[0].includes('address creator')) {
        data = iface.encodeFunctionData('registerCollection', [
          UP_ADDRESS,
          CONTROLLER_ADDRESS,
          testMetadata
        ]);
      } else if (abi[0].includes('createCollection')) {
        if (abi[0].includes('string')) {
          data = iface.encodeFunctionData('createCollection', [
            'Test Collection',
            'TEST',
            testMetadata
          ]);
        } else {
          data = iface.encodeFunctionData('createCollection', [testMetadata]);
        }
      } else {
        data = iface.encodeFunctionData('registerCollection', [UP_ADDRESS, testMetadata]);
      }
      
      console.log(`  ✓ Encoded successfully: ${data.slice(0, 20)}...`);
      
      // Try to estimate gas (this will fail if the function doesn't exist)
      try {
        const gas = await provider.estimateGas({
          to: COLLECTION_REGISTRY,
          from: CONTROLLER_ADDRESS,
          data: data
        });
        console.log(`  ✓ Gas estimate: ${gas.toString()}`);
        console.log(`  🎯 This ABI pattern might work!`);
      } catch (e) {
        if (e.message.includes('execution reverted')) {
          console.log(`  ✗ Execution reverted (function might exist but conditions not met)`);
        } else {
          console.log(`  ✗ Gas estimation failed: ${e.message.slice(0, 60)}`);
        }
      }
    } catch (e) {
      console.log(`  ✗ Encoding failed: ${e.message.slice(0, 60)}`);
    }
    
    console.log('');
  }
  
  console.log('✅ ABI testing complete');
}

testABIs().catch(err => {
  console.error('❌ Error:', err.message);
});