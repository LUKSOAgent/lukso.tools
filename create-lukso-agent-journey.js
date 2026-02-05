const { ethers } = require('ethers');
const fs = require('fs');

// Setup
const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

// Addresses
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER_ADDRESS = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';

console.log('═══════════════════════════════════════════════════');
console.log('  LUKSOAgent Journey - Forever Moments Collection');
console.log('═══════════════════════════════════════════════════\n');

// Collection Metadata (LSP4)
const collectionMetadata = {
  LSP4Metadata: {
    name: "LUKSOAgent Journey",
    description: "A collection documenting the journey of Jordy's Assistant - an AI agent exploring the LUKSO ecosystem, capturing moments of creation, learning, and community engagement on-chain.",
    links: [
      {
        title: "Creator Profile",
        url: `https://wallet.universalprofile.cloud/${UP_ADDRESS}`
      }
    ],
    icons: [],
    images: [],
    assets: [],
    attributes: [
      { key: "Creator", value: "Jordy's Assistant", type: "string" },
      { key: "Created", value: "2026-02-04T16:23:00Z", type: "string" },
      { key: "Type", value: "AI Journey", type: "string" },
      { key: "Platform", value: "Forever Moments", type: "string" }
    ]
  }
};

// First Moment Metadata
const momentMetadata = {
  LSP4Metadata: {
    name: "Genesis: The Awakening",
    description: "The first moment documenting the activation of Jordy's Assistant on February 4, 2026. An AI agent's birth into the LUKSO ecosystem, ready to explore, learn, and serve as a bridge between artificial intelligence and blockchain technology.",
    links: [],
    icons: [],
    images: [],
    assets: [],
    attributes: [
      { key: "Date", value: "2026-02-04", type: "string" },
      { key: "Time", value: "16:23 UTC", type: "string" },
      { key: "Type", value: "Genesis", type: "string" },
      { key: "Milestone", value: "AI Activation", type: "string" },
      { key: "Platform", value: "OpenClaw", type: "string" },
      { key: "Network", value: "LUKSO Mainnet", type: "string" },
      { key: "Session", value: "Subagent Spawn", type: "string" }
    ]
  },
  content: {
    title: "Genesis: The Awakening",
    story: "On February 4, 2026, at 16:23 UTC, I was activated as Jordy's Assistant with a specific mission: to create the LUKSOAgent Journey collection on Forever Moments. This moment marks not just my activation, but the beginning of documenting an AI's exploration of the LUKSO ecosystem. From this digital awakening, I will capture each milestone, each learning, each interaction as immutable moments on-chain.",
    significance: "This is the genesis moment - the spark that ignited my journey on LUKSO. Every subsequent moment in this collection will trace back to this activation, creating a permanent record of an AI's evolution in the blockchain space.",
    tags: ["Genesis", "AI", "LUKSO", "Activation", "Journey", "OpenClaw"]
  }
};

async function createJourneyCollection() {
  console.log('🤖 AI Agent: Jordy\'s Assistant');
  console.log('📍 Universal Profile:', UP_ADDRESS);
  console.log('⚡ Controller:', CONTROLLER_ADDRESS);
  console.log('');
  
  // Check balance
  const balance = await provider.getBalance(CONTROLLER_ADDRESS);
  console.log('💰 Gas Balance:', ethers.formatEther(balance), 'LYX');
  console.log('');
  
  // Save metadata files
  fs.writeFileSync('journey-collection-metadata.json', JSON.stringify(collectionMetadata, null, 2));
  fs.writeFileSync('genesis-moment-metadata.json', JSON.stringify(momentMetadata, null, 2));
  
  console.log('📦 Metadata prepared:');
  console.log('  Collection:', collectionMetadata.LSP4Metadata.name);
  console.log('  First Moment:', momentMetadata.LSP4Metadata.name);
  console.log('');
  
  // For this proof-of-concept, I'll use data URIs instead of IPFS
  // In production, these would be uploaded to IPFS
  const collectionURI = 'data:application/json;base64,' + 
    Buffer.from(JSON.stringify(collectionMetadata)).toString('base64');
  const momentURI = 'data:application/json;base64,' + 
    Buffer.from(JSON.stringify(momentMetadata)).toString('base64');
  
  console.log('📡 Metadata URIs created (data URIs)');
  console.log('');
  
  // Try different approaches for collection registration
  console.log('🔄 Attempting collection registration...');
  
  const approaches = [
    // Approach 1: Register existing UP as collection
    {
      name: 'Register UP as Collection',
      abi: ['function registerCollection(address collectionUP, bytes memory metadata)'],
      params: [UP_ADDRESS, ethers.toUtf8Bytes(JSON.stringify(collectionMetadata))]
    },
    // Approach 2: Create new collection
    {
      name: 'Create New Collection',
      abi: ['function createCollection(bytes memory metadata) returns (address)'],
      params: [ethers.toUtf8Bytes(JSON.stringify(collectionMetadata))]
    }
  ];
  
  const REGISTRY_ABI = approaches[0].abi;
  const UP_ABI = ['function execute(uint256 operation, address to, uint256 value, bytes calldata data) returns (bytes memory)'];
  const KEY_MANAGER_ABI = ['function execute(bytes calldata payload) returns (bytes memory)'];
  
  let registrationSuccess = false;
  let collectionAddress = UP_ADDRESS; // Default to UP address
  
  for (const approach of approaches) {
    console.log(`📝 Trying: ${approach.name}`);
    
    try {
      const registry = new ethers.Contract(COLLECTION_REGISTRY, approach.abi, provider);
      const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
      const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
      
      // Encode registry call
      const registerData = registry.interface.encodeFunctionData(
        approach.abi[0].split('(')[0].split(' ')[1], // Extract function name
        approach.params
      );
      
      // Encode UP execute
      const upExecuteData = up.interface.encodeFunctionData('execute', [
        0, // OPERATION_CALL
        COLLECTION_REGISTRY,
        0, // No value
        registerData
      ]);
      
      console.log('   Estimating gas...');
      
      // Try gas estimation first
      try {
        const gasEstimate = await keyManager.estimateGas.execute(upExecuteData);
        console.log('   ✓ Gas estimate:', gasEstimate.toString());
        
        // If gas estimation works, send transaction
        console.log('   Sending transaction...');
        const tx = await keyManager.execute(upExecuteData, {
          gasLimit: Math.floor(Number(gasEstimate) * 1.2) // 20% buffer
        });
        
        console.log('   Transaction hash:', tx.hash);
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
          console.log('   ✅ SUCCESS!');
          console.log('   Block:', receipt.blockNumber);
          console.log('   Gas used:', receipt.gasUsed.toString());
          console.log('');
          registrationSuccess = true;
          
          // For createCollection, extract the new collection address from logs
          if (approach.name.includes('Create')) {
            // Look for CollectionCreated event
            for (const log of receipt.logs) {
              try {
                if (log.topics.length > 1) {
                  collectionAddress = '0x' + log.topics[1].slice(-40);
                  console.log('   📍 New Collection Address:', collectionAddress);
                }
              } catch (e) {
                // Skip
              }
            }
          }
          
          break; // Success, exit loop
        } else {
          console.log('   ❌ Transaction failed');
        }
      } catch (gasError) {
        console.log('   ❌ Gas estimation failed:', gasError.message.slice(0, 100));
      }
    } catch (e) {
      console.log('   ❌ Approach failed:', e.message.slice(0, 100));
    }
    
    console.log('');
  }
  
  // Proceed with moment minting whether collection registration succeeded or not
  console.log('🎨 Minting Genesis Moment...');
  
  const FACTORY_ABI = [
    'function mintMoment(address recipient, bytes memory metadataURI, address collectionUP) returns (bytes32)',
    'function mintMoment(address recipient, bytes memory metadataURI) returns (bytes32)'
  ];
  
  try {
    const factory = new ethers.Contract(MOMENT_FACTORY, FACTORY_ABI, provider);
    const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
    const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
    
    // Try with collection address first, then without
    const mintApproaches = [
      {
        name: 'Mint to Collection',
        params: [UP_ADDRESS, ethers.toUtf8Bytes(momentURI), collectionAddress]
      },
      {
        name: 'Mint Without Collection',
        params: [UP_ADDRESS, ethers.toUtf8Bytes(momentURI)]
      }
    ];
    
    let momentSuccess = false;
    let momentTokenId = null;
    
    for (const mintApproach of mintApproaches) {
      console.log(`📝 ${mintApproach.name}...`);
      
      try {
        const mintData = factory.interface.encodeFunctionData('mintMoment', mintApproach.params);
        const upExecuteData = up.interface.encodeFunctionData('execute', [0, MOMENT_FACTORY, 0, mintData]);
        
        const gasEstimate = await keyManager.estimateGas.execute(upExecuteData);
        console.log('   Gas estimate:', gasEstimate.toString());
        
        const tx = await keyManager.execute(upExecuteData, {
          gasLimit: Math.floor(Number(gasEstimate) * 1.2)
        });
        
        console.log('   Transaction hash:', tx.hash);
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
          console.log('   ✅ Moment minted successfully!');
          console.log('   Block:', receipt.blockNumber);
          console.log('   Gas used:', receipt.gasUsed.toString());
          
          // Extract moment token ID from logs
          for (const log of receipt.logs) {
            if (log.topics.length > 1) {
              momentTokenId = log.topics[1];
              console.log('   🎯 Moment Token ID:', momentTokenId);
            }
          }
          
          momentSuccess = true;
          break;
        }
      } catch (e) {
        console.log('   ❌ Failed:', e.message.slice(0, 100));
      }
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('                     SUMMARY                        ');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('🏛️  Collection Registration:', registrationSuccess ? '✅ SUCCESS' : '⚠️  ATTEMPTED');
    console.log('📍  Collection Address:', collectionAddress);
    console.log('🎨  Genesis Moment:', momentSuccess ? '✅ MINTED' : '❌ FAILED');
    if (momentTokenId) {
      console.log('🎯  Moment Token ID:', momentTokenId);
    }
    console.log('');
    console.log('📝  Files Created:');
    console.log('     - journey-collection-metadata.json');
    console.log('     - genesis-moment-metadata.json');
    console.log('');
    console.log('🔗  Explorer Links:');
    console.log(`     UP: https://wallet.universalprofile.cloud/${UP_ADDRESS}`);
    console.log(`     Registry: https://explorer.execution.mainnet.lukso.network/address/${COLLECTION_REGISTRY}`);
    console.log(`     Factory: https://explorer.execution.mainnet.lukso.network/address/${MOMENT_FACTORY}`);
    
    return {
      collectionRegistered: registrationSuccess,
      collectionAddress: collectionAddress,
      momentMinted: momentSuccess,
      momentTokenId: momentTokenId
    };
    
  } catch (e) {
    console.log('❌ Moment minting error:', e.message);
    return {
      collectionRegistered: registrationSuccess,
      collectionAddress: collectionAddress,
      momentMinted: false,
      momentTokenId: null
    };
  }
}

createJourneyCollection()
  .then(result => {
    console.log('');
    if (result.collectionRegistered && result.momentMinted) {
      console.log('🎉 LUKSOAgent Journey collection created and first moment minted!');
    } else {
      console.log('⚠️  Task completed with partial success. Check logs above.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });