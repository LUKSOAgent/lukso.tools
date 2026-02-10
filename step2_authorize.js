const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const POTATO_TIPPER = '0x5eed04004c2D46C12Fe30C639A90AD5d6F5D573d';
const POTATO_TOKEN = '0x2b2ea1416d63abf7e3c3657f03806f015625524b';

async function authorize() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('Step 2: Authorize PotatoTipper as POTATO operator');
  
  // Authorize 500 POTATO budget
  const budget = ethers.parseUnits('500', 18);
  
  const lsp7Interface = new ethers.Interface([
    'function authorizeOperator(address operator, uint256 amount, bytes calldata data) external'
  ]);
  const authCalldata = lsp7Interface.encodeFunctionData('authorizeOperator', [
    POTATO_TIPPER,
    budget,
    '0x'
  ]);
  
  console.log('Payload:', authCalldata.slice(0, 80) + '...');
  
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  try {
    console.log('Sending...');
    const tx = await keyManager.execute(authCalldata, { gasLimit: 300000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ SUCCESS! Gas used:', receipt.gasUsed.toString());
    console.log('\n🥔 POTATO TIPPER FULLY CONFIGURED!');
    console.log('- Tip amount: 10 POTATO per new follower');
    console.log('- Min followers: 3');
    console.log('- Min POTATO balance: 10 POTATO');
    console.log('- Budget: 500 POTATO');
  } catch (e) {
    console.error('❌ FAILED:', e.message);
    if (e.data) console.log('Revert data:', e.data);
  }
}

authorize();