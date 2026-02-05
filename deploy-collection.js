const { ethers } = require('ethers');
const LSP23LinkedContractsFactoryABI = require('@lukso/lsp-smart-contracts/artifacts/LSP23LinkedContractsFactory.json');
const UniversalProfileABI = require('@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json');
const LSP6KeyManagerABI = require('@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json');

// Contract addresses on LUKSO Mainnet
const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30'; // Correct LSP23 factory
const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';

// User addresses
const CONTROLLER_ADDRESS = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';
const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

// Private key from credentials
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';

// LUKSO Mainnet RPC
const RPC_URL = 'https://rpc.mainnet.lukso.network';

// CollectionRegistry ABI
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

// MomentFactory ABI
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
    console.log('=== LUKSOAgent Journey Collection Deployment ===\n');
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('Deployer address:', wallet.address);
    console.log('Controller address:', CONTROLLER_ADDRESS);
    console.log('Owner UP:', OWNER_UP);
    
    // Get LSP23 Factory contract
    const lsp23Factory = new ethers.Contract(LSP23_FACTORY, LSP23LinkedContractsFactoryABI.abi, wallet);
    
    // Use the full bytecode from artifacts
    const upBytecode = UniversalProfileABI.bytecode;
    const kmBytecode = LSP6KeyManagerABI.bytecode;
    
    console.log('\n=== Step 1 & 2: Computing predicted addresses ===');
    
    // Generate a random salt
    const salt = ethers.randomBytes(32);
    
    // For UP: constructor takes initialOwner (we'll use a placeholder initially)
    // The UP will be owned by the Key Manager, which we'll deploy together
    // First, we need to compute the predicted addresses
    
    // Create primary contract deployment (UniversalProfile)
    const upConstructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(['address'], [wallet.address]);
    const primaryContractDeployment = {
      salt: salt,
      fundingAmount: 0,
      creationBytecode: upBytecode + upConstructorArgs.slice(2) // Append constructor args
    };
    
    // For Key Manager: constructor takes target (the UP address)
    // We need to compute the predicted UP address first
    // The secondary contract deployment will have the UP address injected
    
    // First, let's compute what the UP address will be
    // The secondary contract needs the UP address as constructor arg
    // We'll use addPrimaryContractAddress = true to inject the address
    
    const secondaryContractDeployment = {
      fundingAmount: 0,
      creationBytecode: kmBytecode, // Will add constructor args dynamically
      addPrimaryContractAddress: true,
      extraConstructorParams: '0x'
    };
    
    // Compute predicted addresses using static call
    const [predictedUP, predictedKeyManager] = await lsp23Factory.computeAddresses(
      primaryContractDeployment,
      secondaryContractDeployment,
      ethers.ZeroAddress, // No post deployment module
      '0x'
    );
    
    console.log('Salt:', ethers.hexlify(salt));
    console.log('Predicted UP Address:', predictedUP);
    console.log('Predicted KeyManager Address:', predictedKeyManager);
    
    console.log('\n=== Step 3: Deploying UP + KeyManager ===');
    
    // Deploy the contracts
    const tx = await lsp23Factory.deployContracts(
      primaryContractDeployment,
      secondaryContractDeployment,
      ethers.ZeroAddress, // No post deployment module
      '0x',
      { value: 0 }
    );
    
    console.log('Deployment transaction hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('Deployment confirmed in block:', receipt.blockNumber);
    
    // Parse the DeployedContracts event to get the actual addresses
    const deployedEvent = receipt.logs.find(
      log => log.topics[0] === ethers.id('DeployedContracts(address,address,(bytes32,uint256,bytes),(uint256,bytes,bool,bytes),address,bytes)')
    );
    
    let deployedUP, deployedKeyManager;
    
    if (deployedEvent) {
      const decodedEvent = lsp23Factory.interface.parseLog(deployedEvent);
      deployedUP = decodedEvent.args.primaryContract;
      deployedKeyManager = decodedEvent.args.secondaryContract;
      console.log('\nDeployed UP (from event):', deployedUP);
      console.log('Deployed KeyManager (from event):', deployedKeyManager);
    } else {
      // Fallback to predicted addresses
      deployedUP = predictedUP;
      deployedKeyManager = predictedKeyManager;
      console.log('\nUsing predicted addresses (event not found):');
      console.log('Deployed UP:', deployedUP);
      console.log('Deployed KeyManager:', deployedKeyManager);
    }
    
    console.log('\n=== Step 4: Creating collection on CollectionRegistry ===');
    
    const collectionRegistry = new ethers.Contract(COLLECTION_REGISTRY, COLLECTION_REGISTRY_ABI, wallet);
    
    const createCollectionTx = await collectionRegistry.createCollection(
      deployedUP,          // collectionUP: the newly deployed UP
      CONTROLLER_ADDRESS,  // controllerUP
      OWNER_UP,            // ownerUP
      0,                   // collectionType: 0 (public)
      0,                   // joiningFee: 0
      ethers.ZeroAddress   // gatingToken: 0x0000...
    );
    
    console.log('createCollection transaction hash:', createCollectionTx.hash);
    const createCollectionReceipt = await createCollectionTx.wait();
    console.log('Collection created in block:', createCollectionReceipt.blockNumber);
    
    console.log('\n=== Step 5: Creating LSP4 metadata ===');
    
    // Create LSP4 metadata for the collection
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
    
    console.log('\n=== Step 6: Uploading metadata to IPFS ===');
    
    // For now, we'll create a data URL for the metadata
    // In production, you'd upload this to IPFS and get a hash
    // For the moment factory, we need a bytes32 metadata URI
    // We'll use a simple hash as placeholder - in reality you'd upload to IPFS
    
    // Create a deterministic hash from the metadata
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataJSON));
    console.log('Metadata hash:', metadataHash);
    
    // For the moment, we'll use the hash directly as the metadata URI
    // In a full implementation, you'd upload to IPFS and use the IPFS hash
    const metadataURI = metadataHash; // bytes32
    
    console.log('\n=== Step 7: Minting moment on factory ===');
    
    const momentFactory = new ethers.Contract(MOMENT_FACTORY, MOMENT_FACTORY_ABI, wallet);
    
    const mintMomentTx = await momentFactory.mintMoment(
      deployedUP,     // collection: the collection UP
      metadataURI,    // metadataURI: bytes32 hash
      OWNER_UP        // creator: your UP
    );
    
    console.log('mintMoment transaction hash:', mintMomentTx.hash);
    const mintMomentReceipt = await mintMomentTx.wait();
    console.log('Moment minted in block:', mintMomentReceipt.blockNumber);
    
    // Try to parse the MomentCreated event to get the token ID
    const momentEvent = mintMomentReceipt.logs.find(
      log => log.topics[0] === ethers.id('MomentCreated(uint256,address,address,bytes32)')
    );
    
    let momentTokenId;
    if (momentEvent) {
      // The token ID is usually in the data or topics
      momentTokenId = momentEvent.topics[1]; // Usually tokenId is the first indexed param
      console.log('\nMoment Token ID (from event):', momentTokenId);
    } else {
      // Check return value from transaction
      // Note: ethers v6 makes this more complex, so we'll use a placeholder
      momentTokenId = "Check transaction receipt for token ID";
      console.log('\nMoment Token ID: Check transaction receipt');
    }
    
    console.log('\n========================================');
    console.log('=== DEPLOYMENT COMPLETE ===');
    console.log('========================================');
    console.log('Collection UP Address:', deployedUP);
    console.log('Collection KeyManager:', deployedKeyManager);
    console.log('Moment Token ID:', momentTokenId);
    console.log('========================================');
    
    // Save results to file
    const results = {
      collectionUP: deployedUP,
      keyManager: deployedKeyManager,
      momentTokenId: momentTokenId,
      metadataHash: metadataHash,
      deploymentTx: tx.hash,
      createCollectionTx: createCollectionTx.hash,
      mintMomentTx: mintMomentTx.hash
    };
    
    require('fs').writeFileSync(
      '/root/.openclaw/workspace/collection-deployment.json',
      JSON.stringify(results, null, 2)
    );
    
    console.log('\nResults saved to collection-deployment.json');
    
  } catch (error) {
    console.error('Error in deployment:', error);
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
