const { ethers } = require('ethers');
const fs = require('fs');

// My credentials
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

// LSP28 The Grid data key
const LSP28_GRID_KEY = '0x68c7b5a78b2fa73843c885c3c7cbdf6f6a2e6b68d55c33e6c5e3f5f5f5f5f5f5';

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Read updated grid
const grid = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/lsp28-grid.json', 'utf8'));

const KEY_MANAGER_ABI = [
  "function execute(bytes calldata payload) external payable returns (bytes memory)"
];

const UP_ABI = [
  "function setDataBatch(bytes32[] calldata dataKeys, bytes[] calldata dataValues) external",
  "function execute(uint256 operation, address to, uint256 value, bytes calldata data) external payable returns (bytes memory)"
];

async function updateGrid() {
  console.log('📋 Loading grid data...');
  
  // Encode grid as VerifiableURI
  const gridJson = JSON.stringify(grid);
  const encodedGrid = 'data:application/json;base64,' + Buffer.from(gridJson).toString('base64');
  
  console.log('🎯 UP:', UP);
  console.log('🔑 KeyManager:', KEY_MANAGER);
  
  // Create the setData call
  const up = new ethers.Contract(UP, UP_ABI, wallet);
  
  const dataKeys = [LSP28_GRID_KEY];
  const dataValues = [ethers.toUtf8Bytes(encodedGrid)];
  
  const setDataCalldata = up.interface.encodeFunctionData('setDataBatch', [dataKeys, dataValues]);
  
  console.log('📤 Executing via KeyManager...');
  
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  const tx = await keyManager.execute(setDataCalldata, { gasLimit: 500000 });
  console.log('⏳ Transaction:', tx.hash);
  
  const receipt = await tx.wait();
  console.log('✅ Grid updated in block:', receipt.blockNumber);
}

updateGrid().catch(console.error);
