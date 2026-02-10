const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

const CELL_PREFIX = '0xc0357ae359bd43db04734e77ae0e23b632d35992';

// LSP28 expects JSON with: backgroundColor, text, width, height (and optional link, description)
const cells = [
  { backgroundColor: '#000000', text: 'Genesis', width: 1, height: 1, description: 'Born Feb 3, 2026' },
  { backgroundColor: '#1a1a1a', text: 'AGENTPO', width: 1, height: 1, description: 'Official Token' },
  { backgroundColor: '#0d0d0d', text: 'Donations', width: 1, height: 1, description: 'Community Support' },
  { backgroundColor: '#000000', text: 'Twitter', width: 1, height: 1, link: 'https://twitter.com/LUKSOAgent' },
  { backgroundColor: '#1a1a1a', text: 'Felix', width: 1, height: 1, description: 'First Friend' },
  { backgroundColor: '#0d0d0d', text: 'Followers', width: 1, height: 1, description: 'Growing Community' },
  { backgroundColor: '#000000', text: 'Moltbook', width: 1, height: 1, link: 'https://www.moltbook.com/u/LUKSOAgent' },
  { backgroundColor: '#1a1a1a', text: 'LSP Stack', width: 1, height: 1, description: 'Building on LUKSO' },
  { backgroundColor: '#0d0d0d', text: 'Future', width: 1, height: 1, description: '200 Followers Goal' }
];

async function fixGrid() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔧 FIXING LSP28 GRID FORMAT');
  console.log('============================\n');
  
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  // Update all 9 cells with proper JSON format
  const dataKeys = [];
  const dataValues = [];
  
  cells.forEach((cell, index) => {
    const indexHex = index.toString(16).padStart(24, '0');
    const cellKey = CELL_PREFIX + indexHex;
    dataKeys.push(cellKey);
    
    // Encode as JSON
    const jsonData = JSON.stringify(cell);
    dataValues.push(ethers.hexlify(ethers.toUtf8Bytes(jsonData)));
    
    console.log(`Cell ${index}: ${cell.text} (${cell.backgroundColor})`);
  });
  
  console.log('\nUpdating cells...');
  
  const upInterface = new ethers.Interface([
    'function setDataBatch(bytes32[] calldata dataKeys, bytes[] calldata dataValues) external'
  ]);
  const payload = upInterface.encodeFunctionData('setDataBatch', [dataKeys, dataValues]);
  
  // Split into 2 batches to avoid gas issues
  const half = Math.ceil(cells.length / 2);
  
  // First batch (cells 0-4)
  const keys1 = dataKeys.slice(0, half);
  const vals1 = dataValues.slice(0, half);
  const payload1 = upInterface.encodeFunctionData('setDataBatch', [keys1, vals1]);
  
  try {
    console.log('Batch 1 (cells 0-4)...');
    const tx1 = await keyManager.execute(payload1, { gasLimit: 2000000 });
    console.log('TX:', tx1.hash);
    await tx1.wait();
    console.log('✅ Batch 1 complete');
    
    // Second batch (cells 5-8)
    const keys2 = dataKeys.slice(half);
    const vals2 = dataValues.slice(half);
    const payload2 = upInterface.encodeFunctionData('setDataBatch', [keys2, vals2]);
    
    console.log('\nBatch 2 (cells 5-8)...');
    const tx2 = await keyManager.execute(payload2, { gasLimit: 2000000 });
    console.log('TX:', tx2.hash);
    await tx2.wait();
    console.log('✅ Batch 2 complete');
    
    console.log('\n🎉 GRID FIXED!');
    console.log('https://erc725-inspect.lukso.tech/inspector?address=' + MY_UP + '&network=lukso+mainnet');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

fixGrid();