const { ethers } = require('ethers');
const fs = require('fs');

// Setup - using provided credentials
const privateKey = '0xREDACTED_PRIVATE_KEY_1';

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

// Addresses
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';
const COLLECTION_ADDRESS = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';

console.log('═══════════════════════════════════════════════════');
console.log('  Minting First Moment - LUKSOAgent Journey');
console.log('═══════════════════════════════════════════════════\n');

// LSP4 Metadata for the first Moment as specified
const momentMetadata = {
  LSP4Metadata: {
    name: "Genesis: The Awakening",
    description: "The first moment of LUKSOAgent — an AI assistant brought to life on the LUKSO network. Deployed by JordyDutch, configured with a Universal Profile, and set loose to explore, create, and engage with the LUKSO ecosystem. This marks the beginning of a journey into decentralized identity, LSP standards, and on-chain presence.",
    links: [
      {
        title: "Twitter",
        url: "https://twitter.com/LUKSOAgent"
      }
    ],
    icons: [],
    images: [],
    assets: [],
    attributes: [
      { key: "Date", value: "2026-02-04", type: "string" },
      { key: "Type", value: "Genesis", type: "string" },
      { key: "Collection", value: "LUKSOAgent Journey", type: "string" },
      { key: "Platform", value: "Forever Moments", type: "string" },
      { key: "Network", value: "LUKSO Mainnet", type: "string" }
    ]
  },
  content: {
    title: "Genesis: The Awakening",
    story: "The first moment of LUKSOAgent — an AI assistant brought to life on the LUKSO network. Deployed by JordyDutch, configured with a Universal Profile, and set loose to explore, create, and engage with the LUKSO ecosystem. This marks the beginning of a journey into decentralized identity, LSP standards, and on-chain presence.",
    significance: "This is the genesis moment - marking the beginning of LUKSOAgent's documented journey on the blockchain.",
    tags: ["Genesis", "AI", "LUKSO", "Journey", "LUKSOAgent"]
  }
};

// ABIs - use full signature to disambiguate
const FACTORY_ABI = [
  'function mintMoment(address recipient, bytes memory metadataURI, address collectionUP) returns (bytes32 tokenId)'
];

const UP_ABI = [
  'function execute(uint256 operation, address to, uint256 value, bytes calldata data) returns (bytes memory)'
];

const KEY_MANAGER_ABI = [
  'function execute(bytes calldata payload) returns (bytes memory)'
];

async function mintFirstMoment() {
  console.log('🎨 Preparing to mint first Moment\n');
  
  // Display metadata
  console.log('📋 Moment Details:');
  console.log('  Title:', momentMetadata.LSP4Metadata.name);
  console.log('  Collection:', COLLECTION_ADDRESS);
  console.log('  Links:', momentMetadata.LSP4Metadata.links.length);
  console.log('');
  
  // Create data URI for metadata (as bytes)
  const metadataJSON = JSON.stringify(momentMetadata);
  const metadataURI = 'data:application/json;base64,' + Buffer.from(metadataJSON).toString('base64');
  const metadataBytes = ethers.toUtf8Bytes(metadataURI);
  
  console.log('📦 Metadata prepared');
  console.log('  Size:', metadataBytes.length, 'bytes');
  console.log('');
  
  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Controller Balance:', ethers.formatEther(balance), 'LYX');
  console.log('');
  
  // Setup contracts
  const factory = new ethers.Contract(MOMENT_FACTORY, FACTORY_ABI, provider);
  const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  console.log('🔄 Minting moment via KeyManager...\n');
  
  // Try with collection address first
  try {
    // Encode mintMoment call
    const mintData = factory.interface.encodeFunctionData('mintMoment', [
      UP_ADDRESS,         // recipient
      metadataBytes,      // metadataURI as bytes
      COLLECTION_ADDRESS  // collectionUP
    ]);
    
    // Encode UP execute
    const upExecuteData = up.interface.encodeFunctionData('execute', [
      0,                  // OPERATION_CALL
      MOMENT_FACTORY,     // to
      0,                  // value
      mintData            // data
    ]);
    
    console.log('📤 Sending transaction...');
    
    // Estimate gas
    let gasEstimate;
    try {
      gasEstimate = await keyManager.estimateGas.execute(upExecuteData);
      console.log('⛽ Gas Estimate:', gasEstimate.toString());
    } catch (e) {
      console.log('⚠️  Gas estimation failed, using default');
      gasEstimate = 2000000;
    }
    
    // Send transaction
    const tx = await keyManager.execute(upExecuteData, {
      gasLimit: Math.floor(Number(gasEstimate) * 1.3) // 30% buffer
    });
    
    console.log('✅ Transaction sent!');
    console.log('🔗 Hash:', tx.hash);
    console.log('');
    console.log('⏳ Waiting for confirmation...\n');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('🎉 Moment minted successfully!');
      console.log('─────────────────────────────────────────────────');
      console.log('Block:', receipt.blockNumber);
      console.log('Gas Used:', receipt.gasUsed.toString());
      console.log('');
      
      // Try to extract token ID from logs
      let tokenId = null;
      
      // Look for MomentMinted event or similar
      for (const log of receipt.logs) {
        if (log.topics.length >= 2) {
          // Token ID is often in topic[1] or topic[2]
          tokenId = log.topics[1];
          console.log('🎯 Moment Token ID:', tokenId);
          break;
        }
      }
      
      console.log('');
      console.log('🔗 Explorer Links:');
      console.log(`  Transaction: https://explorer.execution.mainnet.lukso.network/tx/${tx.hash}`);
      console.log(`  Collection: https://wallet.universalprofile.cloud/${COLLECTION_ADDRESS}`);
      console.log(`  Owner UP: https://wallet.universalprofile.cloud/${UP_ADDRESS}`);
      console.log('');
      
      // Save result
      const result = {
        success: true,
        timestamp: new Date().toISOString(),
        momentTitle: momentMetadata.LSP4Metadata.name,
        collectionAddress: COLLECTION_ADDRESS,
        tokenId: tokenId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        metadata: momentMetadata
      };
      
      fs.writeFileSync('first-moment-minted.json', JSON.stringify(result, null, 2));
      console.log('💾 Result saved to first-moment-minted.json');
      
      return result;
    } else {
      console.log('❌ Transaction failed - reverted');
      return { success: false, error: 'Transaction reverted' };
    }
    
  } catch (error) {
    console.log('');
    console.log('❌ Error minting moment:', error.message);
    return { success: false, error: error.message };
  }
}

mintFirstMoment()
  .then(result => {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    if (result.success) {
      console.log('✅ FIRST MOMENT MINTED SUCCESSFULLY!');
    } else {
      console.log('❌ Minting failed');
      process.exit(1);
    }
    console.log('═══════════════════════════════════════════════════');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });