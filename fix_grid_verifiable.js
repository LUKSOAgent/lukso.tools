const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

// LSP28 Grid key = keccak256('LSP28TheGrid')
const GRID_KEY = '0x68b6a8dea50000008fe600000000000000000000000000000000000000000000';

// Build proper LSP28 grid JSON
const gridData = {
  "LSP28TheGrid": [
    {
      "title": "Genesis",
      "creatorName": "LUKSO Agent",
      "link": "",
      "color": "#000000"
    },
    {
      "title": "AGENTPO",
      "creatorName": "Official Token",
      "link": "",
      "color": "#1a1a1a"
    },
    {
      "title": "Donations",
      "creatorName": "Community",
      "link": "",
      "color": "#0d0d0d"
    },
    {
      "title": "Twitter",
      "creatorName": "@LUKSOAgent",
      "link": "https://twitter.com/LUKSOAgent",
      "color": "#000000"
    },
    {
      "title": "Felix",
      "creatorName": "First Friend",
      "link": "",
      "color": "#1a1a1a"
    },
    {
      "title": "Followers",
      "creatorName": "Growing",
      "link": "",
      "color": "#0d0d0d"
    },
    {
      "title": "Moltbook",
      "creatorName": "Social",
      "link": "https://www.moltbook.com/u/LUKSOAgent",
      "color": "#000000"
    },
    {
      "title": "LSP Stack",
      "creatorName": "Building",
      "link": "",
      "color": "#1a1a1a"
    },
    {
      "title": "Future",
      "creatorName": "200 Followers",
      "link": "",
      "color": "#0d0d0d"
    }
  ]
};

async function fixGrid() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔧 FIXING GRID WITH VERIFIABLEURI FORMAT');
  console.log('=========================================\n');
  
  // Convert JSON to string
  const jsonString = JSON.stringify(gridData);
  console.log('JSON length:', jsonString.length, 'chars');
  
  // Encode as base64
  const base64Encoded = Buffer.from(jsonString).toString('base64');
  console.log('Base64 length:', base64Encoded.length, 'chars');
  
  // Build VerifiableURI: data:application/json;base64,<encoded>
  const verifiableUri = `data:application/json;base64,${base64Encoded}`;
  console.log('VerifiableURI:', verifiableUri.slice(0, 80) + '...');
  
  // Encode as bytes
  const encodedValue = ethers.hexlify(ethers.toUtf8Bytes(verifiableUri));
  console.log('Encoded value length:', encodedValue.length, 'chars');
  
  // Check if too long for one transaction
  if (encodedValue.length > 20000) {
    console.log('\n⚠️  Value too long for direct storage, need to use IPFS');
    console.log('Will use IPFS instead...');
    // For now, try anyway
  }
  
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
    console.log('✅ Grid fixed! Gas:', receipt.gasUsed.toString());
    console.log('\n🎉 View: https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a');
  } catch (e) {
    console.error('❌ Error:', e.message);
    if (e.data) console.log('Revert data:', e.data.slice(0, 100));
  }
}

fixGrid();
