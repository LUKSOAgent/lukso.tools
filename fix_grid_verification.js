const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

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

function encodeWithVerification(jsonData) {
  // Format: 0x0000 + 6f357c6a + keccak256(json) + base64Length + base64EncodedJson
  
  const jsonString = JSON.stringify(jsonData);
  
  // Get base64 of JSON
  const base64Json = Buffer.from(jsonString).toString('base64');
  console.log('Base64 JSON length:', base64Json.length);
  console.log('Base64 length in hex:', (base64Json.length).toString(16));
  
  // Get keccak256 hash of the JSON (not base64)
  const jsonHash = ethers.keccak256(ethers.toUtf8Bytes(jsonString));
  console.log('JSON keccak256:', jsonHash);
  
  // Build the value
  // 0x0000 (identifier) + 6f357c6a (method) + hash + length + base64
  const identifier = '0000';
  const method = '6f357c6a';
  const hash = jsonHash.slice(2); // Remove 0x
  const length = (base64Json.length).toString(16).padStart(4, '0'); // 2 bytes
  const base64Hex = Buffer.from(base64Json).toString('hex');
  
  const result = '0x' + identifier + method + hash + length + base64Hex;
  
  console.log('\nStructure:');
  console.log('Identifier:', identifier);
  console.log('Method:', method);
  console.log('Hash:', hash.slice(0, 20) + '...');
  console.log('Length:', length);
  console.log('Base64 starts:', base64Hex.slice(0, 40));
  console.log('\nFull result starts with:', result.slice(0, 60));
  console.log('Full length:', result.length, 'chars');
  
  return result;
}

async function fixGrid() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔧 FIXING GRID WITH VERIFICATION');
  console.log('=================================\n');
  
  const encodedValue = encodeWithVerification(gridJSON);
  
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