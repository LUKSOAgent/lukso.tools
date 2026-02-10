const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

const GRID_KEY = '0x68b6a8dea50000008fe600000000000000000000000000000000000000000000';

const gridJSON = {
  "LSP28TheGrid": [
    { "title": "Genesis", "creatorName": "LUKSO Agent", "link": "", "color": "#000000" },
    { "title": "AGENTPO", "creatorName": "Official Token", "link": "", "color": "#1a1a1a" },
    { "title": "Donations", "creatorName": "Community", "link": "", "color": "#0d0d0d" },
    { "title": "Twitter", "creatorName": "@LUKSOAgent", "link": "https://twitter.com/LUKSOAgent", "color": "#000000" },
    { "title": "Felix", "creatorName": "First Friend", "link": "", "color": "#1a1a1a" },
    { "title": "Followers", "creatorName": "Growing", "link": "", "color": "#0d0d0d" },
    { "title": "Moltbook", "creatorName": "Social", "link": "https://www.moltbook.com/u/LUKSOAgent", "color": "#000000" },
    { "title": "LSP Stack", "creatorName": "Building", "link": "", "color": "#1a1a1a" },
    { "title": "Future", "creatorName": "200 Followers", "link": "", "color": "#0d0d0d" }
  ]
};

function encodeVerifiableURICorrect(jsonData) {
  // LSP2 VerifiableURI format:
  // 0x0000 (2 bytes identifier) + 
  // verificationMethod (4 bytes) + 
  // verificationDataLength (2 bytes) + 
  // verificationData (variable) + 
  // encodedURL (variable)
  
  const jsonString = JSON.stringify(jsonData);
  
  // Create base64 data URI
  const base64Data = Buffer.from(jsonString).toString('base64');
  const dataUri = `data:application/json;base64,${base64Data}`;
  
  console.log('Data URI:', dataUri.slice(0, 60) + '...');
  
  // For non-verifiable URI (no verification):
  // - identifier: 0x0000
  // - verificationMethod: 0x00000000 (no verification)
  // - verificationDataLength: 0x0000 (0 bytes)
  // - verificationData: empty
  // - encodedURL: UTF-8 hex of dataUri
  
  const verifiableUriIdentifier = '0000';
  const verificationMethod = '00000000'; // No verification
  const verificationDataLength = '0000'; // 0 bytes
  // No verification data
  
  // Encode the URL
  const encodedUrl = ethers.hexlify(ethers.toUtf8Bytes(dataUri)).slice(2); // Remove 0x
  
  // Combine all parts
  const result = '0x' + verifiableUriIdentifier + verificationMethod + verificationDataLength + encodedUrl;
  
  console.log('\nStructure:');
  console.log('Identifier (2 bytes):', verifiableUriIdentifier);
  console.log('Verification method (4 bytes):', verificationMethod);
  console.log('Data length (2 bytes):', verificationDataLength);
  console.log('Encoded URL starts with:', encodedUrl.slice(0, 40));
  console.log('\nFull result starts with:', result.slice(0, 30));
  console.log('Full result length:', result.length, 'chars');
  
  return result;
}

async function fixGrid() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔧 FIXING GRID - CORRECT LSP2 VERIFIABLEURI');
  console.log('=============================================\n');
  
  const encodedValue = encodeVerifiableURICorrect(gridJSON);
  
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  const upInterface = new ethers.Interface([
    'function setData(bytes32 dataKey, bytes calldata dataValue) external'
  ]);
  const payload = upInterface.encodeFunctionData('setData', [GRID_KEY, encodedValue]);
  
  console.log('\nSending transaction...');
  try {
    const tx = await keyManager.execute(payload, { gasLimit: 3000000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Success! Gas:', receipt.gasUsed.toString());
    console.log('\n🎉 Grid fixed with correct LSP2 format!');
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

fixGrid();