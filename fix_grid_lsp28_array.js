const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

// CORRECT: JSON starts with LSP28TheGrid array
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

function encodeGrid(jsonData) {
  const jsonString = JSON.stringify(jsonData);
  
  // Recalculate keccak256 hash
  const jsonBytes = ethers.toUtf8Bytes(jsonString);
  const jsonHash = ethers.keccak256(jsonBytes);
  
  console.log('JSON:');
  console.log(JSON.stringify(jsonData, null, 2));
  console.log('\nJSON hash (new):', jsonHash);
  
  // Build data URI
  const base64Json = Buffer.from(jsonString).toString('base64');
  const dataUri = `data:application/json;base64,${base64Json}`;
  console.log('Data URI length:', dataUri.length);
  
  // Encode
  const identifier = '0000';
  const method = '8019f9b1';
  const verificationDataLength = '0020';
  const hash = jsonHash.slice(2);
  const urlHex = ethers.hexlify(ethers.toUtf8Bytes(dataUri)).slice(2);
  
  const result = '0x' + identifier + method + verificationDataLength + hash + urlHex;
  
  console.log('\nVerifiableURI:');
  console.log('  verification: {');
  console.log('    method: "keccak256(bytes)",');
  console.log('    data: "' + jsonHash + '"');
  console.log('  },');
  console.log('  url: "' + dataUri.slice(0, 60) + '..."');
  
  return result;
}

async function fixGrid() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔧 FIXING GRID - LSP28TheGrid ARRAY STRUCTURE');
  console.log('==============================================\n');
  
  const encodedValue = encodeGrid(gridJSON);
  
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  const upInterface = new ethers.Interface([
    'function setData(bytes32 dataKey, bytes calldata dataValue) external'
  ]);
  const payload = upInterface.encodeFunctionData('setData', [GRID_KEY, encodedValue]);
  
  console.log('\nSending transaction...');
  try {
    const tx = await keyManager.execute(payload, { gasLimit: 4000000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ SUCCESS! Gas:', receipt.gasUsed.toString());
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

fixGrid();