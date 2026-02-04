const { ethers } = require('ethers');
const fs = require('fs');

const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const AGENTPO_ADDRESS = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const ROUTER_ADDRESS = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';

const LSP7_ABI = [
  'function authorizeOperator(address operator, uint256 amount, bytes memory operatorNotificationData)'
];

const ROUTER_ABI = [
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)'
];

const UP_ABI = [
  'function execute(uint256 operation, address to, uint256 value, bytes calldata data) returns (bytes memory)'
];

const KEY_MANAGER_ABI = [
  'function execute(bytes calldata payload) returns (bytes memory)'
];

async function addLiquidity() {
  console.log('🚀 Quick Add Liquidity\n');
  
  const AGENTPO_AMOUNT = ethers.parseEther('100000');
  const LYX_AMOUNT = ethers.parseEther('5');
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  
  const agentpo = new ethers.Contract(AGENTPO_ADDRESS, LSP7_ABI, provider);
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
  const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  // Step 1: Authorize
  console.log('1. Authorizing...');
  const authData = agentpo.interface.encodeFunctionData('authorizeOperator', [
    ROUTER_ADDRESS, AGENTPO_AMOUNT, '0x'
  ]);
  const upAuth = up.interface.encodeFunctionData('execute', [0, AGENTPO_ADDRESS, 0, authData]);
  const tx1 = await keyManager.execute(upAuth);
  console.log('   Tx:', tx1.hash);
  await tx1.wait();
  console.log('   ✅ Done\n');
  
  // Step 2: Add liquidity
  console.log('2. Adding liquidity...');
  const liqData = router.interface.encodeFunctionData('addLiquidityETH', [
    AGENTPO_ADDRESS, AGENTPO_AMOUNT,
    ethers.parseEther('95000'), ethers.parseEther('4.75'),
    UP_ADDRESS, deadline
  ]);
  const upLiq = up.interface.encodeFunctionData('execute', [0, ROUTER_ADDRESS, LYX_AMOUNT, liqData]);
  const tx2 = await keyManager.execute(upLiq, { gasLimit: 1000000 });
  console.log('   Tx:', tx2.hash);
  await tx2.wait();
  console.log('   ✅ Done\n');
  
  console.log('🎉 Liquidity added!');
  console.log('Explorer: https://explorer.execution.mainnet.lukso.network/tx/' + tx2.hash);
}

addLiquidity().catch(err => {
  console.error('❌', err.message);
});