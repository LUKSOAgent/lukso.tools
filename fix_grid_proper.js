const { ethers } = require('ethers');
const { encodeData } = require('@erc725/erc725.js');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

// LSP28 Grid key
const GRID_KEY = '0x68b6a8dea50000008fe600000000000000000000000000000000000000000000';

// Build grid JSON
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

async function fixGrid() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔧 FIXING GRID WITH PROPER LSP2 VERIFIABLEURI ENCODING');
  console.log('========================================================\n');
  
  // Create base64 data URI
  const jsonString = JSON.stringify(gridJSON);
  const base64Data = Buffer.from(jsonString).toString('base64');
  const dataUri = `data:application/json;base64,${base64Data}`;
  
  console.log('Data URI:', dataUri.slice(0, 80) + '...');
  
  // Use erc725.js encodeData for proper VerifiableURI encoding
  const schema = [
    {
      name: 'LSP28TheGrid',
      key: GRID_KEY,
      keyType: 'Singleton',
      valueType: 'VerifiableURI',
      valueContent: 'VerifiableURI'
    }
  ];
  
  const dataToEncode = {
    LSP28TheGrid: {
      verification: {
        method: 'keccak256(utf8)',
        data: ethers.keccak256(ethers.toUtf8Bytes(jsonString))
      },
      url: dataUri
    }
  };
  
  const encodedData = encodeData(dataToEncode, schema);
  console.log('Encoded value:', encodedData.values[0].slice(0, 80) + '...');
  console.log('Starts with:', encodedData.values[0].slice(0, 10));
  
  // Execute via KeyManager
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  const upInterface = new ethers.Interface([
    'function setData(bytes32 dataKey, bytes calldata dataValue) external'
  ]);
  const payload = upInterface.encodeFunctionData('setData', [GRID_KEY, encodedData.values[0]]);
  
  console.log('\nSending transaction...');
  try {
    const tx = await keyManager.execute(payload, { gasLimit: 3000000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Grid fixed with correct encoding! Gas:', receipt.gasUsed.toString());
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

fixGrid();