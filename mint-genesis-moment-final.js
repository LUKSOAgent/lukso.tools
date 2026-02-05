const { ethers } = require('ethers');

// Setup with provided credentials
const privateKey = '0xREDACTED_PRIVATE_KEY_1';
const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

// Addresses
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';
const COLLECTION_ADDRESS = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';

console.log('═══════════════════════════════════════════════════');
console.log('  Minting Genesis Moment - LUKSOAgent Journey');
console.log('═══════════════════════════════════════════════════\n');

// LSP4 Metadata for the first Moment
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
      { key: "Creator", value: "LUKSOAgent", type: "string" },
      { key: "Collection", value: "LUKSOAgent Journey", type: "string" },
      { key: "Platform", value: "Forever Moments", type: "string" },
      { key: "Network", value: "LUKSO Mainnet", type: "string" }
    ]
  }
};

// ABIs
const UP_ABI = [
  'function execute(uint256 operation, address to, uint256 value, bytes calldata data) returns (bytes memory)',
  'function owner() view returns (address)'
];

async function mintGenesisMoment() {
  console.log('🎨 Preparing Genesis Moment\n');
  
  console.log('📋 Moment Details:');
  console.log('  Title:', momentMetadata.LSP4Metadata.name);
  console.log('  Collection:', COLLECTION_ADDRESS);
  console.log('  Creator UP:', UP_ADDRESS);
  console.log('  Controller:', wallet.address);
  console.log('');
  
  // Create metadata as data URI
  const metadataJSON = JSON.stringify(momentMetadata);
  const metadataURI = 'data:application/json;base64,' + Buffer.from(metadataJSON).toString('base64');
  const metadataBytes = ethers.toUtf8Bytes(metadataURI);
  
  console.log('📦 Metadata prepared:');
  console.log('  Size:', metadataBytes.length, 'bytes');
  console.log('  URI length:', metadataURI.length, 'chars');
  console.log('');
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Controller Balance:', ethers.formatEther(balance), 'LYX');
  console.log('');
  
  // Try multiple approaches
  const approaches = [
    {
      name: 'Direct UP execute() call',
      execute: async () => {
        console.log('🔄 Calling UP.execute() directly...\n');
        
        const up = new ethers.Contract(UP_ADDRESS, UP_ABI, wallet);
        
        // Encode mintMoment call without collection (simpler)
        const mintData = new ethers.Interface([
          'function mintMoment(address recipient, bytes memory metadataURI) returns (bytes32)'
        ]).encodeFunctionData('mintMoment', [UP_ADDRESS, metadataBytes]);
        
        console.log('📤 Sending transaction...');
        const tx = await up.execute(
          0,              // OPERATION_CALL
          MOMENT_FACTORY,
          0,              // value
          mintData,
          { gasLimit: 2000000 }
        );
        
        return tx;
      }
    },
    {
      name: 'UP execute() with collection parameter',
      execute: async () => {
        console.log('🔄 Calling UP.execute() with collection...\n');
        
        const up = new ethers.Contract(UP_ADDRESS, UP_ABI, wallet);
        
        // Encode mintMoment call WITH collection
        const mintData = new ethers.Interface([
          'function mintMoment(address recipient, bytes memory metadataURI, address collectionUP) returns (bytes32)'
        ]).encodeFunctionData('mintMoment', [UP_ADDRESS, metadataBytes, COLLECTION_ADDRESS]);
        
        console.log('📤 Sending transaction...');
        const tx = await up.execute(
          0,              // OPERATION_CALL
          MOMENT_FACTORY,
          0,              // value
          mintData,
          { gasLimit: 2000000 }
        );
        
        return tx;
      }
    }
  ];
  
  let success = false;
  let finalResult = null;
  
  for (const approach of approaches) {
    console.log(`📝 Trying: ${approach.name}`);
    
    try {
      const tx = await approach.execute();
      
      console.log('✅ Transaction sent!');
      console.log('🔗 Hash:', tx.hash);
      console.log('');
      console.log('⏳ Waiting for confirmation...\n');
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log('🎉 MOMENT MINTED SUCCESSFULLY!');
        console.log('─────────────────────────────────────────────────');
        console.log('Block:', receipt.blockNumber);
        console.log('Gas Used:', receipt.gasUsed.toString());
        console.log('');
        
        // Look for MomentMinted event or token transfer
        let tokenId = null;
        
        for (const log of receipt.logs) {
          // Look for events from the factory
          if (log.address.toLowerCase() === MOMENT_FACTORY.toLowerCase()) {
            console.log('📋 Factory Event Found:');
            console.log('  Topics:', log.topics.map(t => t.slice(0, 20) + '...'));
            
            // Try to extract token ID from topics
            if (log.topics.length >= 2) {
              tokenId = log.topics[1];
              console.log('  Potential Token ID:', tokenId);
            }
          }
        }
        
        console.log('');
        console.log('🔗 Explorer Links:');
        console.log(`  Transaction: https://explorer.execution.mainnet.lukso.network/tx/${tx.hash}`);
        console.log(`  Owner UP: https://wallet.universalprofile.cloud/${UP_ADDRESS}`);
        console.log(`  Collection: https://wallet.universalprofile.cloud/${COLLECTION_ADDRESS}`);
        
        finalResult = {
          success: true,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          tokenId: tokenId,
          momentTitle: momentMetadata.LSP4Metadata.name,
          collectionAddress: COLLECTION_ADDRESS,
          approach: approach.name
        };
        
        success = true;
        break; // Success, exit loop
        
      } else {
        console.log('❌ Transaction failed - reverted');
      }
    } catch (error) {
      console.log('❌ Failed:', error.message.slice(0, 150));
      
      // Check if it's a gas estimation error
      if (error.message.includes('gas') || error.message.includes('revert')) {
        console.log('   This might be a permissions or authorization issue');
      }
    }
    
    console.log('');
  }
  
  if (success && finalResult) {
    // Save result
    require('fs').writeFileSync('genesis-moment-result.json', JSON.stringify(finalResult, null, 2));
    console.log('💾 Result saved to genesis-moment-result.json');
    
    return finalResult;
  } else {
    console.log('═══════════════════════════════════════════════════');
    console.log('❌ All approaches failed');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('The Forever Moments Factory requires authorization.');
    console.log('Factory Owner:', '0x7dE347bE3EbAED43065182FcABA462796d6f2a83');
    console.log('');
    console.log('Possible solutions:');
    console.log('  1. Use Forever Moments UI at https://forever-moments.io');
    console.log('  2. Contact factory owner for authorization');
    console.log('  3. Register collection through proper Forever Moments flow');
    console.log('');
    
    return { 
      success: false, 
      error: 'Factory authorization required',
      factoryOwner: '0x7dE347bE3EbAED43065182FcABA462796d6f2a83',
      recommendation: 'Use Forever Moments UI or contact factory owner'
    };
  }
}

mintGenesisMoment()
  .then(result => {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    if (result.success) {
      console.log('✅ GENESIS MOMENT MINTED!');
      console.log(`🎯 Token ID: ${result.tokenId || 'Check transaction logs'}`);
      console.log(`🔗 TX Hash: ${result.transactionHash}`);
    } else {
      console.log('❌ Minting failed - authorization required');
    }
    console.log('═══════════════════════════════════════════════════');
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });