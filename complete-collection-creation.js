const { ethers } = require('ethers');
const fs = require('fs');

// Updated credentials
const CONTROLLER_ADDRESS = '0xE093A714960da1bF297522617BfC08132b62B86a';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const COLLECTION_UP = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';

// Contract addresses
const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';

const RPC_URL = 'https://rpc.mainnet.lukso.network';

// ABIs
const UP_ABI = [
  'function execute(uint256 operation, address to, uint256 value, bytes calldata data) external payable returns (bytes memory)',
  'function owner() view returns (address)',
  'function getData(bytes32 dataKey) view returns (bytes)'
];

const KEY_MANAGER_ABI = [
  'function execute(bytes calldata payload) external payable returns (bytes memory)',
  'function getData(bytes32 dataKey) view returns (bytes)',
  'function getNonce(address _address, uint128 _channel) view returns (uint256)'
];

const REGISTRY_ABI = [
  'function createCollection(address collectionUP, address controllerUP, address ownerUP, uint8 collectionType, uint256 joiningFee, address gatingToken) external'
];

const MOMENT_FACTORY_ABI = [
  'function mintMoment(address collection, bytes32 metadataURI, address creator) external returns (uint256)'
];

async function findKeyManager(provider, upAddress) {
  console.log('🔑 Finding Key Manager for UP:', upAddress);
  
  const up = new ethers.Contract(upAddress, UP_ABI, provider);
  
  try {
    const owner = await up.owner();
    console.log('  UP Owner:', owner);
    
    // Check if owner is a contract (KeyManager)
    const ownerCode = await provider.getCode(owner);
    if (ownerCode !== '0x') {
      console.log('  ✓ Owner is a contract (KeyManager)');
      return owner;
    }
  } catch (e) {
    console.log('  Error finding KeyManager:', e.message);
  }
  
  return null;
}

async function checkPermissions(provider, keyManagerAddress, controllerAddress) {
  console.log('\n🔐 Checking permissions for controller:', controllerAddress);
  
  const keyManager = new ethers.Contract(keyManagerAddress, KEY_MANAGER_ABI, provider);
  
  // LSP6 permissions data key: keccak256('LSP6AddressPermissionsMap:<address>')
  // The permission data key is built as: 0x4b80742d0000000082ac0000<address>
  const addressWithoutPrefix = controllerAddress.slice(2).toLowerCase();
  const permissionsKey = '0x4b80742d0000000082ac0000' + addressWithoutPrefix;
  
  try {
    const permissions = await keyManager.getData(permissionsKey);
    console.log('  Permissions:', permissions);
    return permissions !== '0x' && permissions !== '0x0000000000000000000000000000000000000000000000000000000000000000';
  } catch (e) {
    console.log('  Error checking permissions:', e.message);
    return false;
  }
}

async function createCollectionViaKeyManager(wallet, keyManagerAddress) {
  console.log('\n📚 STEP 1: Creating Collection via Registry');
  console.log('  Collection UP:', COLLECTION_UP);
  console.log('  Controller:', CONTROLLER_ADDRESS);
  console.log('  Owner UP:', OWNER_UP);
  console.log('  Registry:', COLLECTION_REGISTRY);
  
  // Create contract instances
  const upInterface = new ethers.Interface(UP_ABI);
  const registryInterface = new ethers.Interface(REGISTRY_ABI);
  const keyManager = new ethers.Contract(keyManagerAddress, KEY_MANAGER_ABI, wallet);
  
  // Encode the createCollection call
  const createCollectionData = registryInterface.encodeFunctionData('createCollection', [
    COLLECTION_UP,        // collectionUP
    CONTROLLER_ADDRESS,   // controllerUP (now matches private key!)
    OWNER_UP,             // ownerUP
    0,                    // collectionType: 0 (public)
    0,                    // joiningFee: 0
    ethers.ZeroAddress    // gatingToken: 0x0
  ]);
  
  console.log('\n  Encoded createCollection call:', createCollectionData.slice(0, 60) + '...');
  
  // Encode the UP's execute call
  const executePayload = upInterface.encodeFunctionData('execute', [
    0,                      // operation: CALL
    COLLECTION_REGISTRY,    // target
    0,                      // value (0 LYX)
    createCollectionData    // data
  ]);
  
  console.log('  Encoded UP.execute payload:', executePayload.slice(0, 60) + '...');
  
  // Execute via KeyManager
  console.log('\n  Sending transaction via KeyManager...');
  
  try {
    const tx = await keyManager.execute(executePayload, {
      gasLimit: 2000000,
      value: 0
    });
    
    console.log('  Transaction sent:', tx.hash);
    console.log('  Waiting for confirmation...');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('  ✅ Collection created successfully!');
      console.log('  Block:', receipt.blockNumber);
      console.log('  Gas used:', receipt.gasUsed.toString());
      console.log('  Explorer: https://explorer.execution.mainnet.lukso.network/tx/' + tx.hash);
      return { success: true, txHash: tx.hash, blockNumber: receipt.blockNumber };
    } else {
      console.log('  ❌ Transaction failed (reverted)');
      return { success: false };
    }
  } catch (err) {
    console.log('  ❌ Error:', err.message);
    if (err.reason) console.log('  Reason:', err.reason);
    if (err.receipt) {
      console.log('  Receipt status:', err.receipt.status);
      console.log('  Gas used:', err.receipt.gasUsed?.toString());
    }
    return { success: false, error: err.message };
  }
}

function createLSP4Metadata() {
  console.log('\n📝 STEP 2: Creating LSP4 Metadata');
  
  const metadata = {
    LSP4Metadata: {
      name: "LUKSOAgent Journey",
      description: "A collection documenting the journey of LUKSOAgent - an AI agent exploring the LUKSO ecosystem. This collection captures moments of discovery, creation, and connection on the LUKSO network.",
      links: [
        { title: "Twitter", url: "https://twitter.com/LUKSOAgent" },
        { title: "LUKSO", url: "https://lukso.network" }
      ],
      images: [],
      assets: [],
      icons: []
    }
  };
  
  const metadataJSON = JSON.stringify(metadata);
  console.log('  Collection name:', metadata.LSP4Metadata.name);
  console.log('  Metadata size:', metadataJSON.length, 'bytes');
  
  // Create deterministic hash for metadata
  const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataJSON));
  console.log('  Metadata hash (simulated IPFS):', metadataHash);
  
  // Save metadata to file
  fs.writeFileSync('/root/.openclaw/workspace/journey-collection-metadata-final.json', JSON.stringify(metadata, null, 2));
  console.log('  ✅ Metadata saved to journey-collection-metadata-final.json');
  
  return { metadata, metadataHash };
}

async function mintMomentViaKeyManager(wallet, keyManagerAddress, metadataHash) {
  console.log('\n🎨 STEP 3: Minting First Moment');
  console.log('  Factory:', MOMENT_FACTORY);
  console.log('  Collection:', COLLECTION_UP);
  console.log('  Creator (Owner UP):', OWNER_UP);
  
  // Create contract instances
  const upInterface = new ethers.Interface(UP_ABI);
  const factoryInterface = new ethers.Interface(MOMENT_FACTORY_ABI);
  const keyManager = new ethers.Contract(keyManagerAddress, KEY_MANAGER_ABI, wallet);
  
  // Encode the mintMoment call
  const mintMomentData = factoryInterface.encodeFunctionData('mintMoment', [
    COLLECTION_UP,  // collection
    metadataHash,   // metadataURI: bytes32 hash
    OWNER_UP        // creator
  ]);
  
  console.log('\n  Encoded mintMoment call:', mintMomentData.slice(0, 60) + '...');
  
  // Encode the UP's execute call
  const executePayload = upInterface.encodeFunctionData('execute', [
    0,                // operation: CALL
    MOMENT_FACTORY,   // target
    0,                // value (0 LYX)
    mintMomentData    // data
  ]);
  
  console.log('  Encoded UP.execute payload:', executePayload.slice(0, 60) + '...');
  
  // Execute via KeyManager
  console.log('\n  Sending transaction via KeyManager...');
  
  try {
    const tx = await keyManager.execute(executePayload, {
      gasLimit: 2000000,
      value: 0
    });
    
    console.log('  Transaction sent:', tx.hash);
    console.log('  Waiting for confirmation...');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('  ✅ Moment minted successfully!');
      console.log('  Block:', receipt.blockNumber);
      console.log('  Gas used:', receipt.gasUsed.toString());
      
      // Extract token ID from logs
      let momentTokenId = "unknown";
      for (const log of receipt.logs) {
        try {
          // Look for Transfer events or similar
          if (log.topics.length >= 4) {
            const possibleTokenId = parseInt(log.topics[3], 16);
            if (possibleTokenId > 0 && possibleTokenId < 1000000) {
              momentTokenId = possibleTokenId.toString();
              break;
            }
          }
        } catch (e) {
          // Continue searching
        }
      }
      
      console.log('  Moment Token ID:', momentTokenId);
      console.log('  Explorer: https://explorer.execution.mainnet.lukso.network/tx/' + tx.hash);
      
      return { success: true, txHash: tx.hash, tokenId: momentTokenId };
    } else {
      console.log('  ❌ Transaction failed (reverted)');
      return { success: false };
    }
  } catch (err) {
    console.log('  ❌ Error:', err.message);
    if (err.reason) console.log('  Reason:', err.reason);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     Forever Moments - Complete Collection Creation             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Updated Credentials:');
  console.log('  Controller:', CONTROLLER_ADDRESS);
  console.log('  Owner UP:', OWNER_UP);
  console.log('  Collection UP:', COLLECTION_UP);
  console.log('');
  
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('Wallet address derived from private key:', wallet.address);
  if (wallet.address.toLowerCase() !== CONTROLLER_ADDRESS.toLowerCase()) {
    console.log('\n❌ ERROR: Private key does not match controller address!');
    console.log('  Expected:', CONTROLLER_ADDRESS);
    console.log('  Got:', wallet.address);
    process.exit(1);
  }
  console.log('  ✅ Private key matches controller address\n');
  
  // Check balance
  const balance = await provider.getBalance(CONTROLLER_ADDRESS);
  console.log('Controller Balance:', ethers.formatEther(balance), 'LYX\n');
  
  if (balance < ethers.parseEther('0.001')) {
    console.log('⚠️  Warning: Low balance. You may need more LYX for gas.');
  }
  
  // Find Key Manager
  const keyManagerAddress = await findKeyManager(provider, OWNER_UP);
  
  if (!keyManagerAddress) {
    console.log('\n❌ Could not find Key Manager');
    process.exit(1);
  }
  
  console.log('  Key Manager:', keyManagerAddress);
  
  // Check permissions
  const hasPermissions = await checkPermissions(provider, keyManagerAddress, CONTROLLER_ADDRESS);
  if (!hasPermissions) {
    console.log('\n⚠️  Warning: Controller may not have permissions on this UP');
    console.log('  Will attempt transaction anyway...\n');
  } else {
    console.log('  ✅ Controller has permissions\n');
  }
  
  // Execute steps
  const results = {
    success: false,
    steps: {},
    timestamp: new Date().toISOString()
  };
  
  // Step 1: Create Collection
  const collectionResult = await createCollectionViaKeyManager(wallet, keyManagerAddress);
  results.steps.createCollection = collectionResult;
  
  if (!collectionResult.success) {
    console.log('\n❌ Step 1 failed. Stopping.');
    fs.writeFileSync('/root/.openclaw/workspace/final-results.json', JSON.stringify(results, null, 2));
    process.exit(1);
  }
  
  // Step 2: Create Metadata
  const metadataResult = createLSP4Metadata();
  results.steps.metadata = { success: true, hash: metadataResult.metadataHash };
  
  // Step 3: Mint Moment
  const mintResult = await mintMomentViaKeyManager(wallet, keyManagerAddress, metadataResult.metadataHash);
  results.steps.mintMoment = mintResult;
  
  // Final summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                  🎉 FINAL RESULTS 🎉                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📍 Collection Address:', COLLECTION_UP);
  console.log('🎫 Moment Token ID:', mintResult.success ? mintResult.tokenId : 'failed');
  console.log('');
  console.log('🔗 Transactions:');
  console.log('  Create Collection:', collectionResult.txHash);
  if (mintResult.success) {
    console.log('  Mint Moment:', mintResult.txHash);
  }
  console.log('');
  console.log('📊 Status:', mintResult.success ? '✅ ALL STEPS COMPLETED' : '⚠️ PARTIAL SUCCESS');
  console.log('');
  
  results.success = mintResult.success;
  results.collectionAddress = COLLECTION_UP;
  results.momentTokenId = mintResult.tokenId;
  results.createCollectionTx = collectionResult.txHash;
  results.mintMomentTx = mintResult.success ? mintResult.txHash : null;
  
  fs.writeFileSync('/root/.openclaw/workspace/final-results.json', JSON.stringify(results, null, 2));
  console.log('💾 Results saved to final-results.json');
  
  return results;
}

main().then(results => {
  if (results.success) {
    console.log('\n✨ LUKSOAgent Journey collection is now live on Forever Moments!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Process completed with issues. Check logs above.');
    process.exit(1);
  }
}).catch(err => {
  console.error('\n💥 Fatal Error:', err.message);
  console.error(err);
  process.exit(1);
});
