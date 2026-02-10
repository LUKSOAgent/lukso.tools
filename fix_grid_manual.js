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

function encodeVerifiableURI(jsonData) {
  // LSP2 VerifiableURI format:
  // - First 32 bytes: verification method (0x0000... = no verification)
  // - Then: the URL/data
  
  const jsonString = JSON.stringify(jsonData);
  const base64Data = Buffer.from(jsonString).toString('base64');
  const dataUri = `data:application/json;base64,${base64Data}`;
  
  console.log('Data URI length:', dataUri.length);
  
  // Encode verification info
  // According to LSP2: first byte is verification method
  // 0x00 = no verification
  // Then we need to encode the length and the data
  
  // From Bridged USDC example, the format seems to be:
  // 0x0000...00 (verification - 32 bytes of zeros for no verification)
  // Then the URL
  
  // Actually, looking at LSP2 spec more carefully:
  // VerifiableURI = verification (32 bytes) + uri (variable length)
  // verification[0] = verification method
  // If verification[0] == 0x00, no verification needed
  
  const verification = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const uriHex = ethers.hexlify(ethers.toUtf8Bytes(dataUri));
  
  // Remove 0x prefix from both and combine
  const verificationBytes = verification.slice(2);
  const uriBytes = uriHex.slice(2);
  
  const result = '0x' + verificationBytes + uriBytes;
  
  console.log('Verification part:', verification.slice(0, 20));
  console.log('URI part starts with:', uriHex.slice(0, 30));
  console.log('Full result starts with:', result.slice(0, 30));
  console.log('Full length:', result.length, 'chars');
  
  return result;
}

async function fixGrid() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔧 FIXING GRID - MANUAL VERIFIABLEURI ENCODING');
  console.log('===============================================\n');
  
  const encodedValue = encodeVerifiableURI(gridJSON);
  
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
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

fixGrid();