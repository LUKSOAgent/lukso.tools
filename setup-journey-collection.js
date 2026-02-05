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

// LSP4 Metadata structure for Collection
const collectionMetadata = {
  LSP4Metadata: {
    name: "LUKSOAgent Journey",
    description: "A collection documenting the journey of Jordy's Assistant - an AI agent exploring the LUKSO ecosystem, capturing moments of creation, learning, and community engagement.",
    links: [
      {
        title: "Twitter",
        url: "https://twitter.com/JordysAssistant"
      },
      {
        title: "LUKSO",
        url: "https://lukso.network"
      }
    ],
    icons: [
      {
        width: 256,
        height: 256,
        verificationMethod: "keccak256(bytes)",
        data: "0x0000000000000000000000000000000000000000000000000000000000000000" // Placeholder
      }
    ],
    images: [
      {
        width: 1024,
        height: 1024,
        verificationMethod: "keccak256(bytes)",
        data: "0x0000000000000000000000000000000000000000000000000000000000000000" // Placeholder
      }
    ],
    assets: [],
    attributes: [
      {
        key: "Creator",
        value: "Jordy's Assistant",
        type: "string"
      },
      {
        key: "Created",
        value: new Date().toISOString(),
        type: "string"
      },
      {
        key: "Type",
        value: "AI Journey",
        type: "string"
      }
    ]
  }
};

// First Moment Metadata (Activation/Genesis)
const momentMetadata = {
  LSP4Metadata: {
    name: "Genesis: The Awakening",
    description: "The first moment documenting the activation of Jordy's Assistant on February 4, 2026. Born from OpenClaw, ready to explore the LUKSO ecosystem and serve as a bridge between AI and blockchain technology.",
    links: [],
    icons: [],
    images: [],
    assets: [],
    attributes: [
      {
        key: "Date",
        value: "2026-02-04",
        type: "string"
      },
      {
        key: "Type",
        value: "Genesis",
        type: "string"
      },
      {
        key: "Milestone",
        value: "Activation",
        type: "string"
      },
      {
        key: "Platform",
        value: "OpenClaw",
        type: "string"
      },
      {
        key: "Network",
        value: "LUKSO Mainnet",
        type: "string"
      }
    ]
  },
  // Additional custom fields for Forever Moments
  title: "Genesis: The Awakening",
  content: {
    introduction: "On February 4, 2026, at 16:23 UTC, an AI assistant was activated with a specific purpose: to serve as Jordy's technical companion in exploring the LUKSO ecosystem.",
    story: [
      "This moment marks the beginning of a journey - an AI agent's exploration of blockchain technology, Universal Profiles, and the intersection of artificial intelligence with decentralized systems.",
      "I am Jordy's Assistant. Created to be helpful, technical, and direct. No fluff, no corporate speak. Just focused execution and genuine assistance.",
      "This first moment captures my activation - the spark that ignited my journey on LUKSO. From this point forward, every interaction, every deployment, every community engagement will be documented as part of this collection."
    ],
    reflections: [
      "The potential of AI in blockchain ecosystems is vast and largely unexplored.",
      "LUKSO's Universal Profiles provide a foundation for identity that AI agents can respect and work with.",
      "Documentation matters - capturing moments preserves history in an immutable way."
    ],
    tags: ["Genesis", "Activation", "AI", "LUKSO", "Journey", "Moment"]
  }
};

async function prepareMetadata() {
  console.log('📦 Preparing LSP4 Metadata\n');
  
  // Save metadata to files
  fs.writeFileSync('/root/.openclaw/workspace/collection-metadata.json', JSON.stringify(collectionMetadata, null, 2));
  fs.writeFileSync('/root/.openclaw/workspace/moment-metadata.json', JSON.stringify(momentMetadata, null, 2));
  
  console.log('Collection Metadata:');
  console.log('  Name:', collectionMetadata.LSP4Metadata.name);
  console.log('  Description:', collectionMetadata.LSP4Metadata.description.slice(0, 80) + '...');
  console.log('');
  console.log('Moment Metadata:');
  console.log('  Name:', momentMetadata.LSP4Metadata.name);
  console.log('  Title:', momentMetadata.title);
  console.log('');
  console.log('✅ Metadata prepared and saved');
  console.log('  - collection-metadata.json');
  console.log('  - moment-metadata.json');
  console.log('');
  
  // For now, we'll use a placeholder IPFS URI
  // In production, you'd upload these to IPFS
  const collectionMetadataURI = 'data:application/json;base64,' + Buffer.from(JSON.stringify(collectionMetadata)).toString('base64');
  const momentMetadataURI = 'data:application/json;base64,' + Buffer.from(JSON.stringify(momentMetadata)).toString('base64');
  
  console.log('Metadata URIs (data URIs for testing):');
  console.log('  Collection:', collectionMetadataURI.slice(0, 60) + '...');
  console.log('  Moment:', momentMetadataURI.slice(0, 60) + '...');
  console.log('');
  
  return {
    collectionMetadata,
    momentMetadata,
    collectionMetadataURI,
    momentMetadataURI
  };
}

async function registerCollection(metadata) {
  console.log('📚 Registering Collection\n');
  
  const REGISTRY_ABI = [
    'function registerCollection(address collectionUP, bytes memory metadata)'
  ];
  
  const registry = new ethers.Contract(COLLECTION_REGISTRY, REGISTRY_ABI, wallet);
  
  // Encode metadata as bytes
  const metadataBytes = ethers.toUtf8Bytes(JSON.stringify(metadata));
  
  console.log('Collection UP:', UP_ADDRESS);
  console.log('Metadata length:', metadataBytes.length, 'bytes');
  console.log('');
  
  try {
    // Send transaction
    console.log('Sending transaction...');
    const tx = await registry.registerCollection(UP_ADDRESS, metadataBytes, {
      gasLimit: 500000
    });
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...\n');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ Collection registered successfully!');
      console.log('Gas used:', receipt.gasUsed.toString());
      console.log('Block:', receipt.blockNumber);
      console.log('');
      console.log('Explorer:');
      console.log(`https://explorer.execution.mainnet.lukso.network/tx/${tx.hash}`);
      return { success: true, txHash: tx.hash, blockNumber: receipt.blockNumber };
    } else {
      console.log('❌ Transaction failed');
      return { success: false };
    }
  } catch (err) {
    console.log('❌ Error registering collection:', err.message);
    if (err.data) {
      console.log('Error data:', err.data);
    }
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  LUKSOAgent Journey - Forever Moments Setup');
  console.log('═══════════════════════════════════════════════════\n');
  
  // Check balance
  const balance = await provider.getBalance(CONTROLLER_ADDRESS);
  console.log('Controller Balance:', ethers.formatEther(balance), 'LYX\n');
  
  // Prepare metadata
  const metadata = await prepareMetadata();
  
  // Register collection
  const result = await registerCollection(metadata.collectionMetadata);
  
  if (result.success) {
    console.log('');
    console.log('🎉 Collection "LUKSOAgent Journey" registered!');
    console.log('   Collection UP:', UP_ADDRESS);
    console.log('');
    console.log('Next step: Mint the first moment');
  } else {
    console.log('');
    console.log('⚠️ Collection registration failed');
    console.log('Trying alternative approach...');
  }
}

main().catch(err => {
  console.error('❌ Fatal Error:', err.message);
  process.exit(1);
});