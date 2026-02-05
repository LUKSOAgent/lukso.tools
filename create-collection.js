const { ethers } = require('ethers');
const UniversalProfileABI = require('@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json');
const LSP6KeyManagerABI = require('@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json');

// Contract addresses
const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';
const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CONTROLLER = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';

// Deployed collection UP from previous deployment
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
    console.log('=== LUKSOAgent Journey Collection Creation ===\n');
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('Using deployed Collection UP:', COLLECTION_UP);
    console.log('Owner UP:', OWNER_UP);
    console.log('Controller:', CONTROLLER);
    console.log('Deployer:', wallet.address);
    
    // Method 1: Try calling createCollection via Universal Profile's execute function
    console.log('\n=== Step 1: Calling createCollection via Universal Profile ===');
    
    const ownerUP = new ethers.Contract(OWNER_UP, UniversalProfileABI.abi, wallet);
    const collectionRegistry = new ethers.Contract(COLLECTION_REGISTRY, COLLECTION_REGISTRY_ABI, provider);
    
    // Encode the createCollection call
    const createCollectionData = collectionRegistry.interface.encodeFunctionData('createCollection', [
      COLLECTION_UP,        // collectionUP
      CONTROLLER,           // controllerUP
      OWNER_UP,             // ownerUP
      0,                    // collectionType: 0 (public)
      0,                    // joiningFee: 0
      ethers.ZeroAddress    // gatingToken: 0x0000...
    ]);
    
    console.log('CreateCollection call data:', createCollectionData);
    
    // Use UP's execute function to call the registry
    // execute(uint256 operationType, address target, uint256 value, bytes calldata data)
    // operationType 0 = CALL
    const executeTx = await ownerUP.execute(
      0,                    // CALL
      COLLECTION_REGISTRY,  // target
      0,                    // value (0 LYX)
      createCollectionData, // data
      { gasLimit: 1000000 }
    );
    
    console.log('Execute transaction hash:', executeTx.hash);
    const executeReceipt = await executeTx.wait();
    console.log('Collection created in block:', executeReceipt.blockNumber);
    
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
    console.log('Metadata:', metadataJSON);
    
    // Create a deterministic hash from the metadata (simulating IPFS upload)
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataJSON));
    console.log('Metadata hash (simulated IPFS):', metadataHash);
    
    console.log('\n=== Step 3: Minting moment via Universal Profile ===');
    
    const momentFactory = new ethers.Contract(MOMENT_FACTORY, MOMENT_FACTORY_ABI, provider);
    
    // Encode the mintMoment call
    const mintMomentData = momentFactory.interface.encodeFunctionData('mintMoment', [
      COLLECTION_UP,  // collection
      metadataHash,   // metadataURI: bytes32 hash
      OWNER_UP        // creator: your UP
    ]);
    
    console.log('MintMoment call data:', mintMomentData);
    
    // Use UP's execute function to call the moment factory
    const mintTx = await ownerUP.execute(
      0,                // CALL
      MOMENT_FACTORY,   // target
      0,                // value (0 LYX)
      mintMomentData,   // data
      { gasLimit: 1000000 }
    );
    
    console.log('Mint transaction hash:', mintTx.hash);
    const mintReceipt = await mintTx.wait();
    console.log('Moment minted in block:', mintReceipt.blockNumber);
    
    // Try to extract the moment token ID from logs
    let momentTokenId = "Check transaction logs";
    for (const log of mintReceipt.logs) {
      try {
        // Look for Transfer or MomentCreated events
        if (log.topics.length > 0) {
          const tokenIdTopic = log.topics[3]; // Usually token ID in ERC721 Transfer
          if (tokenIdTopic) {
            momentTokenId = parseInt(tokenIdTopic, 16);
            break;
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    console.log('\n========================================');
    console.log('=== DEPLOYMENT COMPLETE ===');
    console.log('========================================');
    console.log('Collection UP Address:', COLLECTION_UP);
    console.log('Moment Token ID:', momentTokenId);
    console.log('Create Collection Tx:', executeTx.hash);
    console.log('Mint Moment Tx:', mintTx.hash);
    console.log('========================================');
    
    // Save results
    const results = {
      collectionUP: COLLECTION_UP,
      momentTokenId: momentTokenId,
      metadataHash: metadataHash,
      createCollectionTx: executeTx.hash,
      mintMomentTx: mintTx.hash
    };
    
    require('fs').writeFileSync(
      '/root/.openclaw/workspace/collection-results.json',
      JSON.stringify(results, null, 2)
    );
    
    console.log('\nResults saved to collection-results.json');
    
  } catch (error) {
    console.error('Error:', error);
    if (error.reason) {
      console.error('Error reason:', error.reason);
    }
    if (error.data) {
      console.error('Error data:', error.data);
    }
    process.exit(1);
  }
}

main();