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
const WLYX = '0x6b6F4cb50e67adb082300b90Af49AF499D41d04E';

// ABIs
const LSP7_ABI = [
  'function authorizeOperator(address operator, uint256 amount, bytes memory operatorNotificationData)',
  'function balanceOf(address tokenOwner) view returns (uint256)'
];

const WLYX_ABI = [
  'function deposit() payable',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)'
];

const ROUTER_ABI = [
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)'
];

const UP_ABI = [
  'function execute(uint256 operation, address to, uint256 value, bytes calldata data) returns (bytes memory)'
];

const KEY_MANAGER_ABI = [
  'function execute(bytes calldata payload) returns (bytes memory)'
];

async function addLiquidity() {
  console.log('💧 Adding Liquidity to AGENTPO/WLYX Pair\n');
  
  const AGENTPO_AMOUNT = ethers.parseEther('100000');
  const LYX_AMOUNT = ethers.parseEther('3'); // Use 3 LYX (have 4.2, keep 1.2 for gas)
  
  console.log('Amounts:');
  console.log('  AGENTPO:', ethers.formatEther(AGENTPO_AMOUNT));
  console.log('  LYX (for WLYX):', ethers.formatEther(LYX_AMOUNT));
  console.log('');
  
  const agentpo = new ethers.Contract(AGENTPO_ADDRESS, LSP7_ABI, provider);
  const wlyx = new ethers.Contract(WLYX, WLYX_ABI, provider);
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
  const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  // Step 1: Wrap LYX to WLYX
  console.log('Step 1: Wrapping LYX to WLYX...');
  const wrapData = wlyx.interface.encodeFunctionData('deposit');
  const upWrap = up.interface.encodeFunctionData('execute', [0, WLYX, LYX_AMOUNT, wrapData]);
  const tx1 = await keyManager.execute(upWrap);
  console.log('  Tx:', tx1.hash);
  await tx1.wait();
  console.log('  ✅ LYX wrapped to WLYX\n');
  
  // Step 2: Approve Router for WLYX
  console.log('Step 2: Approving WLYX for Router...');
  const approveWLYXData = wlyx.interface.encodeFunctionData('approve', [ROUTER_ADDRESS, LYX_AMOUNT]);
  const upApproveWLYX = up.interface.encodeFunctionData('execute', [0, WLYX, 0, approveWLYXData]);
  const tx2 = await keyManager.execute(upApproveWLYX);
  console.log('  Tx:', tx2.hash);
  await tx2.wait();
  console.log('  ✅ WLYX approved\n');
  
  // Step 3: Authorize Router for AGENTPO
  console.log('Step 3: Authorizing Router for AGENTPO...');
  const authData = agentpo.interface.encodeFunctionData('authorizeOperator', [
    ROUTER_ADDRESS, AGENTPO_AMOUNT, '0x'
  ]);
  const upAuth = up.interface.encodeFunctionData('execute', [0, AGENTPO_ADDRESS, 0, authData]);
  const tx3 = await keyManager.execute(upAuth);
  console.log('  Tx:', tx3.hash);
  await tx3.wait();
  console.log('  ✅ AGENTPO authorized\n');
  
  // Step 4: Add liquidity
  console.log('Step 4: Adding liquidity...');
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  
  const addLiqData = router.interface.encodeFunctionData('addLiquidity', [
    AGENTPO_ADDRESS,
    WLYX,
    AGENTPO_AMOUNT,
    LYX_AMOUNT,
    ethers.parseEther('95000'), // 5% slippage
    ethers.parseEther('2.85'),  // 5% slippage (3 * 0.95)
    UP_ADDRESS,
    deadline
  ]);
  
  const upAddLiq = up.interface.encodeFunctionData('execute', [0, ROUTER_ADDRESS, 0, addLiqData]);
  const tx4 = await keyManager.execute(upAddLiq, { gasLimit: 1000000 });
  console.log('  Tx:', tx4.hash);
  await tx4.wait();
  console.log('  ✅ Liquidity added!\n');
  
  console.log('🎉 SUCCESS!');
  console.log('Explorer: https://explorer.execution.mainnet.lukso.network/tx/' + tx4.hash);
}

addLiquidity().catch(err => {
  console.error('❌ Error:', err.message);
});