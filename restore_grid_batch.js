const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

// LSP28 keys
const GRID_KEY = '0xad94ddc9b96d01ba04c2735c808fc71fbfdc3783000000000000000000000000';
const CELL_PREFIX = '0xc0357ae359bd43db04734e77ae0e23b632d35992';

// Simple cell data - just title to reduce gas
const cells = [
  'Genesis',
  'AGENTPO', 
  'Donations',
  'Twitter',
  'Felix',
  'Followers',
  'Moltbook',
  'LSP Stack',
  'Future'
];

async function restoreGrid() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🎨 RESTORING LSP28 GRID (SIMPLIFIED)');
  console.log('=====================================\n');
  
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  // Just set 3 cells at a time to reduce gas
  const dataKeys = [GRID_KEY];
  const dataValues = ['0x'];
  
  // First 3 cells
  for (let i = 0; i < 3; i++) {
    const indexHex = i.toString(16).padStart(24, '0');
    const cellKey = CELL_PREFIX + indexHex;
    dataKeys.push(cellKey);
    dataValues.push(ethers.hexlify(ethers.toUtf8Bytes(cells[i])));
    console.log(`Cell ${i}: ${cells[i]}`);
  }
  
  console.log('\nSetting first 3 cells...');
  
  const upInterface = new ethers.Interface([
    'function setDataBatch(bytes32[] calldata dataKeys, bytes[] calldata dataValues) external'
  ]);
  const payload = upInterface.encodeFunctionData('setDataBatch', [dataKeys, dataValues]);
  
  try {
    const tx = await keyManager.execute(payload, { gasLimit: 2000000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Part 1 complete! Gas:', receipt.gasUsed.toString());
    
    // Continue with next batch
    console.log('\nSetting cells 3-5...');
    const dataKeys2 = [];
    const dataValues2 = [];
    for (let i = 3; i < 6; i++) {
      const indexHex = i.toString(16).padStart(24, '0');
      const cellKey = CELL_PREFIX + indexHex;
      dataKeys2.push(cellKey);
      dataValues2.push(ethers.hexlify(ethers.toUtf8Bytes(cells[i])));
    }
    
    const payload2 = upInterface.encodeFunctionData('setDataBatch', [dataKeys2, dataValues2]);
    const tx2 = await keyManager.execute(payload2, { gasLimit: 2000000 });
    console.log('TX:', tx2.hash);
    const receipt2 = await tx2.wait();
    console.log('✅ Part 2 complete! Gas:', receipt2.gasUsed.toString());
    
    // Final batch
    console.log('\nSetting cells 6-8...');
    const dataKeys3 = [];
    const dataValues3 = [];
    for (let i = 6; i < 9; i++) {
      const indexHex = i.toString(16).padStart(24, '0');
      const cellKey = CELL_PREFIX + indexHex;
      dataKeys3.push(cellKey);
      dataValues3.push(ethers.hexlify(ethers.toUtf8Bytes(cells[i])));
    }
    
    const payload3 = upInterface.encodeFunctionData('setDataBatch', [dataKeys3, dataValues3]);
    const tx3 = await keyManager.execute(payload3, { gasLimit: 2000000 });
    console.log('TX:', tx3.hash);
    const receipt3 = await tx3.wait();
    console.log('✅ Part 3 complete! Gas:', receipt3.gasUsed.toString());
    
    console.log('\n🎉 GRID FULLY RESTORED!');
    console.log('https://erc725-inspect.lukso.tech/inspector?address=' + MY_UP + '&network=lukso+mainnet');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

restoreGrid();