const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

// CORRECT LSP28TheGrid key
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

function encodeVerifiableURI(jsonData) {
  const jsonString = JSON.stringify(jsonData);
  const base64Data = Buffer.from(jsonString).toString('base64');
  const dataUri = `data:application/json;base64,${base64Data}`;
  
  // LSP2 VerifiableURI: 0x0000 + verificationMethod(4) + dataLength(2) + url
  const result = '0x0000000000000000' + ethers.hexlify(ethers.toUtf8Bytes(dataUri)).slice(2);
  return result;
}

async function fixGrid() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔧 FIXING GRID - CORRECT DATA KEY');
  console.log('===================================\n');
  console.log('Key:', GRID_KEY);
  
  const encodedValue = encodeVerifiableURI(gridJSON);
  console.log('Encoded value starts with:', encodedValue.slice(0, 30));
  
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
    console.log('✅ SUCCESS! Gas:', receipt.gasUsed.toString());
    console.log('\n🎉 Grid should now display correctly!');
    console.log('View: https://erc725-inspect.lukso.tech/inspector?address=0x293E96ebbf264ed7715cff2b67850517De70232a&network=lukso+mainnet');
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

fixGrid();