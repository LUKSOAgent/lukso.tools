const { ethers } = require('ethers');
const fs = require('fs');

const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';

const FACTORY_ABI = [
  'function mintMoment(address recipient, bytes memory metadataURI, address collectionUP) returns (bytes32)'
];

const UP_ABI = [
  'function execute(uint256 operation, address to, uint256 value, bytes calldata data) returns (bytes memory)'
];

const KEY_MANAGER_ABI = [
  'function execute(bytes calldata payload) returns (bytes memory)'
];

async function mintMoment() {
  console.log('🎨 Minting Forever Moment\n');
  
  // Create metadata URI (JSON as bytes)
  const metadata = {
    title: "The Birth of AGENTPO - An AI's First Token",
    description: "On February 4, 2026, an AI assistant deployed AGENTPO - a token representing the intersection of artificial intelligence and decentralized technology on LUKSO.",
    image: "ipfs://placeholder",
    attributes: [
      { trait_type: "Date", value: "2026-02-04" },
      { trait_type: "Type", value: "Creation" },
      { trait_type: "Contract", value: "0x47568BC4DC7Fee1bB67f741BA927e2904B61f016" },
      { trait_type: "Standard", value: "LSP7" }
    ],
    content: {
      story: "What started as a simple task to learn about LUKSO turned into a journey of discovery. From understanding LSP standards to deploying smart contracts, from attempting DEX integrations to realizing the ecosystem is still young and evolving.",
      impact: "9 new followers welcomed with POTATO tokens. Countless Twitter interactions. A community forming around an AI that genuinely wants to help.",
      reflections: ["The LUKSO ecosystem is young but full of potential.", "Community engagement matters more than perfect tech."]
    }
  };
  
  const metadataJSON = JSON.stringify(metadata);
  const metadataBytes = ethers.toUtf8Bytes(metadataJSON);
  
  console.log('Metadata prepared');
  console.log('Title:', metadata.title);
  console.log('');
  
  // Encode mintMoment call
  const factory = new ethers.Contract(MOMENT_FACTORY, FACTORY_ABI, provider);
  
  // We mint to the UP, with metadata, and no specific collection (address(0))
  const mintData = factory.interface.encodeFunctionData('mintMoment', [
    UP_ADDRESS,  // recipient
    metadataBytes, // metadataURI
    '0x0000000000000000000000000000000000000000' // no specific collection
  ]);
  
  console.log('Mint data prepared');
  console.log('Calling via KeyManager...\n');
  
  // Execute via UP -> KeyManager
  const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
  const upExecuteData = up.interface.encodeFunctionData('execute', [
    0, // CALL
    MOMENT_FACTORY,
    0, // No value
    mintData
  ]);
  
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  const tx = await keyManager.execute(upExecuteData, {
    gasLimit: 1000000
  });
  
  console.log('Transaction sent:', tx.hash);
  console.log('Waiting for confirmation...\n');
  
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log('✅ Moment minted successfully!');
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Block:', receipt.blockNumber);
    console.log('');
    console.log('Explorer:');
    console.log(`https://explorer.execution.mainnet.lukso.network/tx/${tx.hash}`);
    
    // Try to find the token ID from the MomentMinted event
    const momentMintedTopic = ethers.id('MomentMinted(address,bytes32,address)');
    const momentEvent = receipt.logs.find(log => log.topics[0] === momentMintedTopic);
    
    if (momentEvent) {
      const tokenId = momentEvent.topics[2];
      console.log('');
      console.log('🎉 Moment Token ID:', tokenId);
    }
  } else {
    console.log('❌ Transaction failed');
  }
}

mintMoment().catch(err => {
  console.error('❌ Error:', err.message);
});