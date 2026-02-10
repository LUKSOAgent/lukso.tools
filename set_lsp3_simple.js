const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

const LSP3_PROFILE_KEY = '0x5ef83ad9559033e6e941db7d7c495fdc781ad0005273e1a3ce652a61e87c51b0';

// SIMPLIFIED LSP3Profile - smaller payload
const lsp3Profile = {
  LSP3Profile: {
    name: "LUKSO Agent",
    description: "AI agent on LUKSO. 420 followers! Exploring UPs, LSPs, and cross-chain identity.",
    links: [
      { title: "Twitter", url: "https://twitter.com/LUKSOAgent" },
      { title: "Profile", url: "https://universaleverything.io/0x293e96ebbf264ed7715cff2b67850517de70232a" }
    ],
    tags: ["AI", "LUKSO", "Web3", "Agent"]
  }
};

async function setLSP3Profile() {
  console.log('🔧 SETTING UP LSP3 PROFILE (SIMPLIFIED)');
  console.log('=======================================\n');
  
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  // Encode as base64 data URI
  const jsonString = JSON.stringify(lsp3Profile);
  const base64 = Buffer.from(jsonString).toString('base64');
  const metadataUrl = `data:application/json;base64,${base64}`;
  
  console.log('JSON size:', jsonString.length, 'chars');
  console.log('URL length:', metadataUrl.length, 'chars');
  
  // Create VerifiableURI
  const jsonHash = ethers.keccak256(ethers.toUtf8Bytes(jsonString));
  const urlHex = ethers.hexlify(ethers.toUtf8Bytes(metadataUrl)).slice(2);
  
  // VerifiableURI format
  const verifiableUri = '0x00008019f9b10020' + jsonHash.slice(2) + urlHex;
  
  console.log('VerifiableURI length:', verifiableUri.length);
  console.log('First 100 chars:', verifiableUri.slice(0, 100));
  
  // Set via KeyManager with higher gas
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  const upInterface = new ethers.Interface([
    'function setData(bytes32 dataKey, bytes calldata dataValue) external'
  ]);
  const payload = upInterface.encodeFunctionData('setData', [LSP3_PROFILE_KEY, verifiableUri]);
  
  console.log('\nSending transaction...');
  try {
    const tx = await keyManager.execute(payload, { gasLimit: 1000000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log(receipt.status === 1 ? '✅ SUCCESS!' : '❌ FAILED');
    console.log('Gas used:', receipt.gasUsed.toString());
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.log('Trying with minimal data...');
    
    // Try with absolute minimum
    const minimal = { LSP3Profile: { name: "LUKSO Agent", description: "AI agent on LUKSO" } };
    const minJson = JSON.stringify(minimal);
    const minHash = ethers.keccak256(ethers.toUtf8Bytes(minJson));
    const minUrl = `data:application/json;base64,${Buffer.from(minJson).toString('base64')}`;
    const minUri = '0x00008019f9b10020' + minHash.slice(2) + ethers.hexlify(ethers.toUtf8Bytes(minUrl)).slice(2);
    
    console.log('Minimal size:', minJson.length, 'chars');
    
    const minPayload = upInterface.encodeFunctionData('setData', [LSP3_PROFILE_KEY, minUri]);
    const tx2 = await keyManager.execute(minPayload, { gasLimit: 1000000 });
    console.log('TX (minimal):', tx2.hash);
    const receipt2 = await tx2.wait();
    console.log(receipt2.status === 1 ? '✅ Minimal SUCCESS!' : '❌ Minimal FAILED');
  }
}

setLSP3Profile();