const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

const POTATO_TOKEN = '0x80D898C5A3A0B118a0c8C8aDcdBB260FC687F1ce';
const POTATO_TIPPER = '0x5eed04004c2D46C12Fe30C639A90AD5d6F5D573d';
const AMOUNT = ethers.parseUnits('1000', 18); // 1,000 POTATO with 18 decimals

async function authorizePotatoTipper() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔧 AUTHORIZING POTATO TIPPER');
  console.log('============================\n');
  console.log('POTATO Token:', POTATO_TOKEN);
  console.log('PotatoTipper:', POTATO_TIPPER);
  console.log('Amount:', ethers.formatUnits(AMOUNT, 18), 'POTATO\n');
  
  // LSP7 authorizeOperator function signature
  const lsp7Interface = new ethers.Interface([
    'function authorizeOperator(address operator, uint256 amount, bytes memory operatorNotificationData) external'
  ]);
  
  // Encode the authorizeOperator call
  const authorizeCalldata = lsp7Interface.encodeFunctionData('authorizeOperator', [
    POTATO_TIPPER,
    AMOUNT,
    '0x' // operatorNotificationData = empty
  ]);
  
  console.log('Calldata:', authorizeCalldata.slice(0, 60) + '...\n');
  
  // Now execute via KeyManager (execute via UP)
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  const upInterface = new ethers.Interface([
    'function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external'
  ]);
  
  // operationType 0 = CALL
  const payload = upInterface.encodeFunctionData('execute', [
    0, // CALL
    POTATO_TOKEN,
    0, // no value
    authorizeCalldata
  ]);
  
  console.log('Sending transaction...');
  try {
    const tx = await keyManager.execute(payload, { gasLimit: 500000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ SUCCESS! Gas:', receipt.gasUsed.toString());
    console.log('\nPotatoTipper is now authorized to spend 1,000 POTATO tokens!');
  } catch (e) {
    console.error('❌ Error:', e.message);
    if (e.data) {
      console.log('Revert data:', e.data);
    }
  }
}

authorizePotatoTipper();