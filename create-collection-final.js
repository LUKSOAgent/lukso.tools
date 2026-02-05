const { ethers } = require('ethers');
const UniversalProfileABI = require('@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json');
const LSP6KeyManagerABI = require('@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json');

// Contract addresses
const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';
const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CONTROLLER = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';

// Deployed collection UP
const COLLECTION_UP = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';

// Private key
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const RPC_URL = 'https://rpc.mainnet.lukso.network';

// ABIs
const COLLECTION_REGISTRY_ABI = [
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

const MOMENT_FACTORY_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "collection", "type": "address" },
      { "internalType": "bytes32", "name": "metadataURI", "type": "bytes32" },
      { "internalType": "address", "name": "creator", "type": "address" }
    ],
    "name": "mintMoment",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function main() {
  try {
    console.log('=== LUKSOAgent Journey Collection Creation via KeyManager ===\n');
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('Using deployed Collection UP:', COLLECTION_UP);
    console.log('Owner UP:', OWNER_UP);
    console.log('Key Manager:', KEY_MANAGER);
    console.log('Deployer:', wallet.address);
    
    // Create contract interfaces
    const keyManager = new ethers.Contract(KEY_MANAGER, LSP6KeyManagerABI.abi, wallet);
    const universalProfileInterface = new ethers.Interface(UniversalProfileABI.abi);
    const collectionRegistryInterface = new ethers.Interface(COLLECTION_REGISTRY_ABI);
    
    console.log('\n=== Step 1: Calling createCollection via KeyManager ===');
    
    // First, encode the createCollection call
    const createCollectionData = collectionRegistryInterface.encodeFunctionData('createCollection', [
      COLLECTION_UP,        // collectionUP
      CONTROLLER,           // controllerUP
      OWNER_UP,             // ownerUP
      0,                    // collectionType: 0 (public)
      0,                    // joiningFee: 0
      ethers.ZeroAddress    // gatingToken: 0x0000...
    ]);
    
    console.log('CreateCollection call data:', createCollectionData);
    
    // Then encode the UP's execute call
    const executePayload = universalProfileInterface.encodeFunctionData('execute', [
      0,                    // CALL
      COLLECTION_REGISTRY,  // target
      0,                    // value (0 LYX)
      createCollectionData  // data
    ]);
    
    console.log('Execute payload for KeyManager:', executePayload);
    
    // Finally, call the KeyManager's execute function with the payload
    const executeTx = await keyManager.execute(executePayload, { 
      gasLimit: 1000000,
      value: 0
    });
    
    console.log('KeyManager execute transaction hash:', executeTx.hash);
    const executeReceipt = await executeTx.wait();
    
    if (executeReceipt.status === 1) {
      console.log('✅ Collection created successfully in block:', executeReceipt.blockNumber);
    } else {
      console.log('❌ Collection creation failed');
      throw new Error('Transaction reverted');
    }
    
    console.log('\n=== Step 2: Creating LSP4 metadata ===');
    
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
    console.log('✅ Metadata created:', metadataJSON.length, 'characters');
    
    // Create a deterministic hash from the metadata
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataJSON));
    console.log('📄 Metadata hash (simulated IPFS):', metadataHash);
    
    console.log('\n=== Step 3: Minting moment via KeyManager ===');
    
    const momentFactoryInterface = new ethers.Interface(MOMENT_FACTORY_ABI);
    
    // Encode the mintMoment call
    const mintMomentData = momentFactoryInterface.encodeFunctionData('mintMoment', [
      COLLECTION_UP,  // collection
      metadataHash,   // metadataURI: bytes32 hash
      OWNER_UP        // creator: your UP
    ]);
    
    console.log('MintMoment call data:', mintMomentData);
    
    // Encode the UP's execute call for mintMoment
    const mintExecutePayload = universalProfileInterface.encodeFunctionData('execute', [
      0,                // CALL
      MOMENT_FACTORY,   // target
      0,                // value (0 LYX)
      mintMomentData    // data
    ]);
    
    // Call the KeyManager's execute function for minting
    const mintTx = await keyManager.execute(mintExecutePayload, { 
      gasLimit: 1000000,
      value: 0
    });
    
    console.log('Mint transaction hash:', mintTx.hash);
    const mintReceipt = await mintTx.wait();
    
    if (mintReceipt.status === 1) {
      console.log('✅ Moment minted successfully in block:', mintReceipt.blockNumber);
    } else {
      console.log('❌ Moment minting failed');
      throw new Error('Mint transaction reverted');
    }
    
    // Extract moment token ID from logs
    let momentTokenId = "Check transaction logs";
    for (const log of mintReceipt.logs) {
      try {
        // Look for Transfer events or other events with token ID
        if (log.topics.length >= 4) {
          const possibleTokenId = parseInt(log.topics[3], 16);
          if (possibleTokenId > 0 && possibleTokenId < 1000000) { // reasonable token ID range
            momentTokenId = possibleTokenId;
            console.log('🎯 Found moment token ID:', momentTokenId);
            break;
          }
        } else if (log.topics.length >= 2) {
          // Try second topic
          const possibleTokenId = parseInt(log.topics[1], 16);
          if (possibleTokenId > 0 && possibleTokenId < 1000000) {
            momentTokenId = possibleTokenId;
            console.log('🎯 Found moment token ID:', momentTokenId);
            break;
          }
        }
      } catch (e) {
        // Continue searching
      }
    }
    
    console.log('\n========================================');
    console.log('🎉 SUCCESS! COLLECTION CREATED! 🎉');
    console.log('========================================');
    console.log('📍 Collection UP Address:', COLLECTION_UP);
    console.log('🎫 Moment Token ID:', momentTokenId);
    console.log('🔗 Create Collection Tx:', executeTx.hash);
    console.log('🔗 Mint Moment Tx:', mintTx.hash);
    console.log('========================================');
    
    // Save final results
    const results = {
      success: true,
      collectionUP: COLLECTION_UP,
      momentTokenId: momentTokenId,
      metadataHash: metadataHash,
      createCollectionTx: executeTx.hash,
      mintMomentTx: mintTx.hash,
      metadata: metadata,
      timestamp: new Date().toISOString()
    };
    
    require('fs').writeFileSync(
      '/root/.openclaw/workspace/final-results.json',
      JSON.stringify(results, null, 2)
    );
    
    console.log('\n💾 Results saved to final-results.json');
    console.log('\n📋 SUMMARY:');
    console.log(`✨ Collection: "${metadata.LSP4Metadata.name}"`);
    console.log(`📍 Address: ${COLLECTION_UP}`);
    console.log(`🎫 First Moment Token ID: ${momentTokenId}`);
    console.log('\n🚀 The LUKSOAgent Journey collection is now live on Forever Moments!');
    
  } catch (error) {
    console.error('\n💥 Error:', error.message);
    if (error.reason) {
      console.error('🔍 Reason:', error.reason);
    }
    if (error.code === 'CALL_EXCEPTION' && error.receipt) {
      console.error('📊 Transaction status:', error.receipt.status);
      console.error('⛽ Gas used:', error.receipt.gasUsed?.toString());
    }
    
    console.log('\n📋 Current Progress:');
    console.log('✅ Universal Profile deployed:', COLLECTION_UP);
    console.log('❌ Collection/Moment creation failed');
    
    process.exit(1);
  }
}

main();