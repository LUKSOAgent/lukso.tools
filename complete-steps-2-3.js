const { ethers } = require('ethers');
const fs = require('fs');

// Setup
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const COLLECTION_UP = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';
const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';

// ABI
const FACTORY_ABI = [
  'function mintMoment(address collection, bytes32 metadataURI, address creator) external returns (uint256)'
];

// Step 2: Create LSP4 Metadata
function createMetadata() {
  console.log('📝 STEP 2: Creating LSP4 Metadata\n');
  
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
  const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataJSON));
  
  console.log('  Collection name:', metadata.LSP4Metadata.name);
  console.log('  Description:', metadata.LSP4Metadata.description.substring(0, 60) + '...');
  console.log('  Metadata size:', metadataJSON.length, 'bytes');
  console.log('  Metadata hash:', metadataHash);
  
  // Save metadata
  fs.writeFileSync('/root/.openclaw/workspace/journey-collection-metadata-final.json', JSON.stringify(metadata, null, 2));
  console.log('  ✅ Metadata saved to journey-collection-metadata-final.json\n');
  
  return metadataHash;
}

// Step 3: Mint Moment
async function mintMoment(metadataHash) {
  console.log('🎨 STEP 3: Minting First Moment\n');
  console.log('  Factory:', MOMENT_FACTORY);
  console.log('  Collection:', COLLECTION_UP);
  console.log('  Creator (Owner UP):', OWNER_UP);
  console.log('  Metadata hash:', metadataHash);
  console.log('');
  
  const factory = new ethers.Contract(MOMENT_FACTORY, FACTORY_ABI, wallet);
  
  try {
    console.log('Sending mintMoment transaction...');
    const tx = await factory.mintMoment(
      COLLECTION_UP,  // collection
      metadataHash,   // metadataURI
      OWNER_UP,       // creator
      { gasLimit: 1000000 }
    );
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ Moment minted successfully!');
      console.log('Block:', receipt.blockNumber);
      console.log('Gas used:', receipt.gasUsed.toString());
      
      // Extract token ID from logs
      let momentTokenId = "unknown";
      for (const log of receipt.logs) {
        try {
          // Look for Transfer event
          if (log.topics.length >= 4) {
            const possibleTokenId = parseInt(log.topics[3], 16);
            if (possibleTokenId > 0 && possibleTokenId < 1000000) {
              momentTokenId = possibleTokenId.toString();
              break;
            }
          }
        } catch (e) {
          // Continue
        }
      }
      
      console.log('Moment Token ID:', momentTokenId);
      console.log('Explorer: https://explorer.execution.mainnet.lukso.network/tx/' + tx.hash);
      
      return { success: true, txHash: tx.hash, tokenId: momentTokenId };
    } else {
      console.log('❌ Transaction failed');
      return { success: false };
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
    if (err.reason) console.log('Reason:', err.reason);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     Forever Moments - Steps 2 & 3 (Collection Already Created) ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('Collection Address:', COLLECTION_UP);
  console.log('Owner UP:', OWNER_UP);
  console.log('Controller:', wallet.address);
  console.log('');
  
  // Step 2: Create metadata
  const metadataHash = createMetadata();
  
  // Step 3: Mint moment
  const mintResult = await mintMoment(metadataHash);
  
  if (mintResult.success) {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                  🎉 ALL STEPS COMPLETED! 🎉                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log('📍 Collection Address:', COLLECTION_UP);
    console.log('🎫 Moment Token ID:', mintResult.tokenId);
    console.log('🔗 Mint Transaction:', mintResult.txHash);
    console.log('\n✨ LUKSOAgent Journey collection is now live on Forever Moments!');
    
    // Save results
    const results = {
      success: true,
      collectionAddress: COLLECTION_UP,
      momentTokenId: mintResult.tokenId,
      mintTxHash: mintResult.txHash,
      metadataHash: metadataHash,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync('/root/.openclaw/workspace/final-results.json', JSON.stringify(results, null, 2));
  } else {
    console.log('\n⚠️ Step 3 (minting) failed. Collection created but no moment minted.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
