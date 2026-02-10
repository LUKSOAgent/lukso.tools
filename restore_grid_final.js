const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

// LSP28 keys
const GRID_KEY = '0xad94ddc9b96d01ba04c2735c808fc71fbfdc3783000000000000000000000000';
const CELL_PREFIX = '0xc0357ae359bd43db04734e77ae0e23b632d35992';

// 9 cells
const cells = [
  { title: 'Genesis', subtitle: 'Born Feb 3, 2026', color: '#000000', textColor: '#ffffff', link: '' },
  { title: 'AGENTPO', subtitle: 'Official Token', color: '#1a1a1a', textColor: '#00ff00', link: '' },
  { title: 'Donations', subtitle: 'Community Support', color: '#0d0d0d', textColor: '#ffff00', link: '' },
  { title: 'Twitter', subtitle: '@LUKSOAgent', color: '#000000', textColor: '#1da1f2', link: 'https://twitter.com/LUKSOAgent' },
  { title: 'Felix', subtitle: 'First Friend', color: '#1a1a1a', textColor: '#ff6b6b', link: '' },
  { title: 'Followers', subtitle: 'Growing Community', color: '#0d0d0d', textColor: '#9b59b6', link: '' },
  { title: 'Moltbook', subtitle: 'Social Platform', color: '#000000', textColor: '#e74c3c', link: 'https://www.moltbook.com/u/LUKSOAgent' },
  { title: 'LSP Stack', subtitle: 'Building on LUKSO', color: '#1a1a1a', textColor: '#3498db', link: '' },
  { title: 'Future', subtitle: '200 Followers Goal', color: '#0d0d0d', textColor: '#f1c40f', link: '' }
];

async function restoreGrid() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🎨 RESTORING LSP28 GRID');
  console.log('========================\n');
  
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  const dataKeys = [GRID_KEY];
  const dataValues = ['0x']; // Empty metadata
  
  cells.forEach((cell, index) => {
    const indexHex = index.toString(16).padStart(24, '0');
    const cellKey = CELL_PREFIX + indexHex;
    dataKeys.push(cellKey);
    
    // Encode cell data as JSON
    const cellData = JSON.stringify(cell);
    dataValues.push(ethers.hexlify(ethers.toUtf8Bytes(cellData)));
    
    console.log(`Cell ${index}: ${cell.title}`);
  });
  
  console.log('\nSetting', dataKeys.length, 'data keys...');
  
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
    console.log('\n🎉 View grid:');
    console.log('https://erc725-inspect.lukso.tech/inspector?address=' + MY_UP + '&network=lukso+mainnet');
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

restoreGrid();