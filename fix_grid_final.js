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

function encodeCorrectLSP2(jsonData) {
  const jsonString = JSON.stringify(jsonData);
  
  // 1. Hash of the JSON file (for verification data)
  const jsonHash = ethers.keccak256(ethers.toUtf8Bytes(jsonString));
  
  // 2. Build data URI
  const base64Json = Buffer.from(jsonString).toString('base64');
  const dataUri = `data:application/json;base64,${base64Json}`;
  
  console.log('JSON hash:', jsonHash);
  console.log('Data URI length:', dataUri.length);
  
  // 3. Encode components
  const identifier = '0000';
  const method = '6f357c6a'; // keccak256(utf8)
  const verificationDataLength = '0020'; // 32 bytes for the hash
  const hash = jsonHash.slice(2); // Remove 0x
  const urlHex = ethers.hexlify(ethers.toUtf8Bytes(dataUri)).slice(2);
  
  // 4. Build final value: identifier + method + length + hash + url
  const result = '0x' + identifier + method + verificationDataLength + hash + urlHex;
  
  console.log('\nStructure:');
  console.log('  Identifier:', identifier);
  console.log('  Method:', method);
  console.log('  Verification data length:', verificationDataLength);
  console.log('  Hash:', hash.slice(0, 20) + '...');
  console.log('  URL starts:', urlHex.slice(0, 40));
  console.log('\nFull result starts with:', result.slice(0, 70));
  console.log('Full length:', result.length);
  
  return result;
}

async function fixGrid() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔧 FIXING GRID - CORRECT LSP2 FORMAT');
  console.log('=====================================\n');
  console.log('Adding missing verification data length field!\n');
  
  const encodedValue = encodeCorrectLSP2(gridJSON);
  
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