const { ethers } = require('ethers');
const fs = require('fs');

// Setup provider and wallet
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const RPC_URL = 'https://rpc.mainnet.lukso.network';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Contract addresses
const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';  // Owner UP (where we call execute)
const COLLECTION_UP = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';  // Already deployed
const CONTROLLER_UP = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';  // Controller
const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';  // Registry
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';  // Factory

// UniversalProfile ABI (only need execute function)
const UP_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "operationType", "type": "uint256" },
      { "internalType": "address", "name": "target", "type": "address" },
      { "internalType": "uint256", "name": "value", "type": "uint256" },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "execute",
    "outputs": [{ "internalType": "bytes", "name": "", "type": "bytes" }],
    "stateMutability": "payable",
    "type": "function"
  }
];

// CollectionRegistry ABI (createCollection function)
const REGISTRY_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "collectionUP", "type": "address" },
      { "internalType": "address", "name": "controllerUP", "type": "address" },
      { "internalType": "address", "name": "ownerUP", "type": "address" },
      { "internalType": "uint8", "name": "collectionType", "type": "uint8" },
      { "internalType": "uint256", "name": "joiningFee", "type": "uint256" },
      { "internalType": "address", "name": "gatingToken", "type": "address" }
    ],
    "name": "createCollection",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function main() {
  console.log('=== Forever Moments Collection Creation ===\n');
  console.log('Using BuddyK\'s approach: UP.execute() directly on Owner UP\n');
  
  console.log('Configuration:');
  console.log('  Owner UP:', OWNER_UP);
  console.log('  Collection UP:', COLLECTION_UP);
  console.log('  Controller UP:', CONTROLLER_UP);
  console.log('  Registry:', COLLECTION_REGISTRY);
  console.log('  Wallet:', wallet.address);
  console.log('');
  
  // Step 1: Create the createCollection calldata
  console.log('Step 1: Encoding createCollection calldata...');
  
  const registryInterface = new ethers.Interface(REGISTRY_ABI);
  const createCollectionCalldata = registryInterface.encodeFunctionData('createCollection', [
    COLLECTION_UP,        // collectionUP
    CONTROLLER_UP,        // controllerUP
    OWNER_UP,             // ownerUP
    0,                    // collectionType: 0 (public)
    0,                    // joiningFee: 0
    ethers.ZeroAddress    // gatingToken: 0x0000...
  ]);
  
  console.log('  createCollection calldata:', createCollectionCalldata);
  console.log('');
  
  // Step 2: Call UP.execute(0, registryAddress, 0, createCollectionCalldata)
  console.log('Step 2: Calling UP.execute() on Owner UP...');
  console.log('  operationType: 0 (CALL)');
  console.log('  target:', COLLECTION_REGISTRY);
  console.log('  value: 0');
  console.log('');
  
  const ownerUPContract = new ethers.Contract(OWNER_UP, UP_ABI, wallet);
  
  try {
    console.log('Sending transaction...');
    const tx = await ownerUPContract.execute(
      0,                       // operationType: CALL
      COLLECTION_REGISTRY,     // target: CollectionRegistry
      0,                       // value: 0
      createCollectionCalldata // data: encoded createCollection call
    );
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    console.log('  Gas used:', receipt.gasUsed.toString());
    console.log('');
    
    // Check for events
    console.log('Step 3: Checking for events...');
    
    // CollectionCreated event signature
    const collectionCreatedTopic = ethers.id('CollectionCreated(address,address)');
    const collectionRegisteredTopic = ethers.id('CollectionRegistered(address,address,bytes)');
    
    const relevantLogs = receipt.logs.filter(log => {
      return log.topics[0] === collectionCreatedTopic || 
             log.topics[0] === collectionRegisteredTopic;
    });
    
    if (relevantLogs.length > 0) {
      console.log('  Found', relevantLogs.length, 'relevant event(s):');
      relevantLogs.forEach((log, i) => {
        console.log(`    Event ${i + 1}:`, log.topics[0] === collectionCreatedTopic ? 'CollectionCreated' : 'CollectionRegistered');
        console.log(`    Address:`, log.address);
      });
    } else {
      console.log('  No CollectionCreated/CollectionRegistered events found in receipt');
      console.log('  (This is OK - events might be emitted by the registry, not the UP)');
    }
    
    console.log('');
    console.log('========================================');
    console.log('=== COLLECTION CREATION SUCCESSFUL ===');
    console.log('========================================');
    console.log('Transaction Hash:', tx.hash);
    console.log('Collection UP:', COLLECTION_UP);
    console.log('Owner UP:', OWNER_UP);
    console.log('========================================');
    
    // Save result
    const result = {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      collectionUP: COLLECTION_UP,
      ownerUP: OWNER_UP,
      controllerUP: CONTROLLER_UP,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('/root/.openclaw/workspace/collection-creation-result.json', JSON.stringify(result, null, 2));
    console.log('\nResult saved to collection-creation-result.json');
    
    return { success: true, txHash: tx.hash };
    
  } catch (error) {
    console.error('');
    console.error('❌ Transaction failed!');
    console.error('');
    console.error('Error:', error.message);
    
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
    
    if (error.data) {
      console.error('Data:', error.data);
    }
    
    // Try to decode error
    if (error.message.includes('execution reverted')) {
      console.error('');
      console.error('Possible causes:');
      console.error('  - Caller not authorized on UP');
      console.error('  - Collection already registered');
      console.error('  - Invalid parameters');
      console.error('  - Registry access control rejection');
    }
    
    const result = {
      success: false,
      error: error.message,
      reason: error.reason || null,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('/root/.openclaw/workspace/collection-creation-result.json', JSON.stringify(result, null, 2));
    
    return { success: false, error: error.message };
  }
}

main().then(result => {
  if (result.success) {
    console.log('\n✅ Collection creation complete!');
    process.exit(0);
  } else {
    console.log('\n❌ Collection creation failed!');
    process.exit(1);
  }
}).catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
