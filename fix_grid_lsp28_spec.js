const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

// CORRECT LSP28 structure per spec
const gridJSON = {
  "LSP28TheGrid": [
    {
      "title": "LUKSO Agent Grid",
      "gridColumns": 3,
      "visibility": "public",
      "grid": [
        {
          "width": 1,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "Genesis",
            "text": "LUKSO Agent",
            "backgroundColor": "#000000",
            "textColor": "#ffffff"
          }
        },
        {
          "width": 1,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "AGENTPO",
            "text": "Official Token",
            "backgroundColor": "#1a1a1a",
            "textColor": "#ffffff"
          }
        },
        {
          "width": 1,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "Donations",
            "text": "Community",
            "backgroundColor": "#0d0d0d",
            "textColor": "#ffffff"
          }
        },
        {
          "width": 1,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "Twitter",
            "text": "@LUKSOAgent",
            "backgroundColor": "#000000",
            "textColor": "#ffffff",
            "link": "https://twitter.com/LUKSOAgent"
          }
        },
        {
          "width": 1,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "Felix",
            "text": "First Friend",
            "backgroundColor": "#1a1a1a",
            "textColor": "#ffffff"
          }
        },
        {
          "width": 1,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "Followers",
            "text": "Growing",
            "backgroundColor": "#0d0d0d",
            "textColor": "#ffffff"
          }
        },
        {
          "width": 1,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "Moltbook",
            "text": "Social",
            "backgroundColor": "#000000",
            "textColor": "#ffffff",
            "link": "https://www.moltbook.com/u/LUKSOAgent"
          }
        },
        {
          "width": 1,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "LSP Stack",
            "text": "Building",
            "backgroundColor": "#1a1a1a",
            "textColor": "#ffffff"
          }
        },
        {
          "width": 1,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "Future",
            "text": "200 Followers",
            "backgroundColor": "#0d0d0d",
            "textColor": "#ffffff"
          }
        }
      ]
    }
  ]
};

function encodeGrid(jsonData) {
  const jsonString = JSON.stringify(jsonData);
  const jsonHash = ethers.keccak256(ethers.toUtf8Bytes(jsonString));
  
  console.log('JSON structure (per LSP28 spec):');
  console.log(JSON.stringify(jsonData, null, 2).slice(0, 500) + '...\n');
  console.log('JSON hash:', jsonHash);
  
  const base64Json = Buffer.from(jsonString).toString('base64');
  const dataUri = `data:application/json;base64,${base64Json}`;
  
  const identifier = '0000';
  const method = '8019f9b1';
  const verificationDataLength = '0020';
  const hash = jsonHash.slice(2);
  const urlHex = ethers.hexlify(ethers.toUtf8Bytes(dataUri)).slice(2);
  
  const result = '0x' + identifier + method + verificationDataLength + hash + urlHex;
  
  console.log('\nVerifiableURI:');
  console.log('  verification.data:', jsonHash);
  console.log('  url:', dataUri.slice(0, 60) + '...');
  
  return result;
}

async function fixGrid() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔧 FIXING GRID - CORRECT LSP28 STRUCTURE');
  console.log('=========================================\n');
  console.log('Grid items now have: width, height, type, properties\n');
  
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
    const tx = await keyManager.execute(payload, { gasLimit: 5000000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ SUCCESS! Gas:', receipt.gasUsed.toString());
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

fixGrid();