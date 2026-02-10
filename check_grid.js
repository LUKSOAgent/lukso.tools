const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

// LSP28 grid keys
const GRID_PREFIX = '0x68b6a8dea50000008fe6';
const GRID_CELL_PREFIX = '0x68b6a8dea50000008fe7';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  console.log('Checking LSP28 Grid state...\n');
  
  // Check grid metadata
  const gridKey = GRID_PREFIX + '0000000000000000000000000000000000000000000000000000000000000000';
  try {
    const grid = await up.getData(gridKey);
    console.log('Grid metadata:', grid);
  } catch (e) {
    console.log('No grid metadata found');
  }
  
  // Check first few cells
  for (let i = 0; i < 3; i++) {
    const cellKey = GRID_CELL_PREFIX + i.toString(16).padStart(64, '0');
    try {
      const cell = await up.getData(cellKey);
      console.log(`Cell ${i}:`, cell.slice(0, 100) + '...');
    } catch (e) {
      console.log(`Cell ${i}: Not found`);
    }
  }
}

check();
