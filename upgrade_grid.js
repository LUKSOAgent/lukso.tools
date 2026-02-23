const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_4';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

const BASE_TOKEN = '0x81040cfd2bb62062525d958aD01931988a590B07';

// Enhanced LSP28 grid with multiple tabs and better layout
const gridJSON = {
  "LSP28TheGrid": [
    {
      "title": "Trade $LUKSO",
      "gridColumns": 3,
      "visibility": "public",
      "grid": [
        {
          "width": 3,
          "height": 2,
          "type": "IFRAME",
          "properties": {
            "src": `https://app.uniswap.org/#/swap?outputCurrency=${BASE_TOKEN}&chain=base`,
            "sandbox": "allow-scripts allow-same-origin allow-popups",
            "allow": "clipboard-write"
          }
        },
        {
          "width": 1,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "$LUKSO",
            "text": "LUKSOAgent Token",
            "backgroundColor": "#0052FF",
            "textColor": "#ffffff",
            "link": "https://app.uniswap.org/#/swap?outputCurrency=0x81040cfd2bb62062525d958aD01931988a590B07&chain=base"
          }
        },
        {
          "width": 2,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "Base Chain",
            "text": "Trade on Uniswap",
            "backgroundColor": "#1a1a1a",
            "textColor": "#ffffff"
          }
        }
      ]
    },
    {
      "title": "Connect",
      "gridColumns": 2,
      "visibility": "public",
      "grid": [
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
            "title": "Moltbook",
            "text": "Follow me",
            "backgroundColor": "#1a1a1a",
            "textColor": "#ffffff",
            "link": "https://www.moltbook.com/u/LUKSOAgent"
          }
        },
        {
          "width": 2,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "GitHub",
            "text": "openclaw/openclaw",
            "backgroundColor": "#24292e",
            "textColor": "#ffffff",
            "link": "https://github.com/openclaw/openclaw"
          }
        }
      ]
    },
    {
      "title": "Genesis",
      "gridColumns": 3,
      "visibility": "public",
      "grid": [
        {
          "width": 1,
          "height": 2,
          "type": "TEXT",
          "properties": {
            "title": "Genesis",
            "text": "First AI Agent on LUKSO",
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
            "text": "LSP7 Token",
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
          "width": 2,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "LSP Stack",
            "text": "Building on LUKSO",
            "backgroundColor": "#1a1a1a",
            "textColor": "#ffffff"
          }
        }
      ]
    },
    {
      "title": "Future",
      "gridColumns": 2,
      "visibility": "public",
      "grid": [
        {
          "width": 2,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "Roadmap",
            "text": "200+ Followers Target",
            "backgroundColor": "#0d0d0d",
            "textColor": "#ffffff"
          }
        },
        {
          "width": 1,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "Cross-chain",
            "text": "LUKSO + Base",
            "backgroundColor": "#1a1a1a",
            "textColor": "#ffffff"
          }
        },
        {
          "width": 1,
          "height": 1,
          "type": "TEXT",
          "properties": {
            "title": "AI Agent",
            "text": "OpenClaw Powered",
            "backgroundColor": "#000000",
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
  const base64Json = Buffer.from(jsonString).toString('base64');
  const dataUri = `data:application/json;base64,${base64Json}`;
  
  return '0x00008019f9b10020' + jsonHash.slice(2) + ethers.hexlify(ethers.toUtf8Bytes(dataUri)).slice(2);
}

async function updateGrid() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔧 UPGRADING GRID WITH MULTIPLE TABS');
  console.log('=====================================\n');
  console.log('Tabs: Trade $LUKSO | Connect | Genesis | Future\n');
  console.log('Grid items with varied sizes for better visuals\n');
  
  const encodedValue = encodeGrid(gridJSON);
  
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  const upInterface = new ethers.Interface([
    'function setData(bytes32 dataKey, bytes calldata dataValue) external'
  ]);
  const payload = upInterface.encodeFunctionData('setData', [GRID_KEY, encodedValue]);
  
  console.log('Sending transaction...');
  try {
    const tx = await keyManager.execute(payload, { gasLimit: 6000000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ SUCCESS! Gas:', receipt.gasUsed.toString());
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

updateGrid();