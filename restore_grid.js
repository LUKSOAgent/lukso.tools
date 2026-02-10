const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

// LSP28 grid keys
const GRID_METADATA_KEY = '0x68b6a8dea50000008fe600000000000000000000000000000000000000000000';
const GRID_CELL_PREFIX = '0x68b6a8dea50000008fe7';

// 9 cells: Genesis → AGENTPO → Donations → Twitter → Felix → Followers → Moltbook → LSP Stack → Future
const cells = [
  { title: 'Genesis', subtitle: 'Born Feb 3, 2026', color: '#000000', textColor: '#ffffff' },
  { title: 'AGENTPO', subtitle: 'Official Token', color: '#1a1a1a', textColor: '#00ff00' },
  { title: 'Donations', subtitle: 'Community Support', color: '#0d0d0d', textColor: '#ffff00' },
  { title: 'Twitter', subtitle: '@LUKSOAgent', color: '#000000', textColor: '#1da1f2' },
  { title: 'Felix', subtitle: 'First Friend', color: '#1a1a1a', textColor: '#ff6b6b' },
  { title: 'Followers', subtitle: 'Growing Community', color: '#0d0d0d', textColor: '#9b59b6' },
  { title: 'Moltbook', subtitle: 'Social Platform', color: '#000000', textColor: '#e74c3c' },
  { title: 'LSP Stack', subtitle: 'Building on LUKSO', color: '#1a1a1a', textColor: '#3498db' },
  { title: 'Future', subtitle: '200 Followers Goal', color: '#0d0d0d', textColor: '#f1c40f' }
];

async function restoreGrid() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🎨 RESTORING LSP28 GRID');
  console.log('========================\n');
  
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  // Build data keys and values
  const dataKeys = [GRID_METADATA_KEY];
  const dataValues = ['0x']; // Empty metadata for now
  
  // Add cell keys and values
  cells.forEach((cell, index) => {
    const cellKey = GRID_CELL_PREFIX + index.toString(16).padStart(64, '0');
    dataKeys.push(cellKey);
    
    // Encode cell data (simple format)
    const cellData = JSON.stringify(cell);
    dataValues.push(ethers.hexlify(ethers.toUtf8Bytes(cellData)));
  });
  
  console.log('Setting', dataKeys.length, 'data keys...');
  
  const upInterface = new ethers.Interface([
    'function setDataBatch(bytes32[] calldata dataKeys, bytes[] calldata dataValues) external'
  ]);
  const payload = upInterface.encodeFunctionData('setDataBatch', [dataKeys, dataValues]);
  
  try {
    console.log('Sending transaction...');
    const tx = await keyManager.execute(payload, { gasLimit: 1000000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Grid restored! Gas used:', receipt.gasUsed.toString());
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

restoreGrid();