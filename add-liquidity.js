const { ethers } = require('ethers');
const fs = require('fs');

// Load credentials
const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

// Addresses
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const AGENTPO_ADDRESS = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const ROUTER_ADDRESS = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';

// LSP7 ABI
const LSP7_ABI = [
  'function authorizeOperator(address operator, uint256 amount, bytes memory operatorNotificationData)',
  'function authorizedAmountFor(address operator, address tokenOwner) view returns (uint256)',
  'function balanceOf(address tokenOwner) view returns (uint256)'
];

const ROUTER_ABI = [
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) payable returns (uint amountA, uint amountB, uint liquidity)'
];

const UP_ABI = [
  'function execute(uint256 operation, address to, uint256 value, bytes calldata data) returns (bytes memory)'
];

const KEY_MANAGER_ABI = [
  'function execute(bytes calldata payload) returns (bytes memory)'
];

async function addLiquidity() {
  console.log('💧 Adding Liquidity to Universal Swaps');
  console.log('=======================================\n');
  
  // Amounts
  const AGENTPO_AMOUNT = ethers.parseEther('100000'); // 100k AGENTPO
  const LYX_AMOUNT = ethers.parseEther('5'); // 5 LYX
  
  console.log('Adding:');
  console.log('  AGENTPO:', ethers.formatEther(AGENTPO_AMOUNT));
  console.log('  LYX:', ethers.formatEther(LYX_AMOUNT));
  console.log('');
  
  // Step 1: Authorize Router as operator
  console.log('Step 1: Authorizing Router as operator...');
  
  const agentpo = new ethers.Contract(AGENTPO_ADDRESS, LSP7_ABI, provider);
  
  // Encode authorizeOperator call
  const authorizeData = agentpo.interface.encodeFunctionData('authorizeOperator', [
    ROUTER_ADDRESS,
    AGENTPO_AMOUNT,
    '0x' // empty bytes
  ]);
  
  // Encode UP.execute
  const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
  const upExecuteData = up.interface.encodeFunctionData('execute', [
    0, // CALL
    AGENTPO_ADDRESS,
    0,
    authorizeData
  ]);
  
  // Execute via KeyManager
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  const authTx = await keyManager.execute(upExecuteData);
  console.log('Authorization tx:', authTx.hash);
  await authTx.wait();
  console.log('✅ Router authorized!\n');
  
  // Step 2: Add liquidity
  console.log('Step 2: Adding liquidity...');
  
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  
  // For LSP7/WLYX pair - token order matters
  // Usually native token is represented as address(0) or wrapped version
  const addLiquidityData = router.interface.encodeFunctionData('addLiquidity', [
    AGENTPO_ADDRESS,           // tokenA
    '0x0000000000000000000000000000000000000000', // tokenB (native LYX)
    AGENTPO_AMOUNT,            // amountADesired
    LYX_AMOUNT,                // amountBDesired
    ethers.parseEther('95000'), // amountAMin (5% slippage)
    ethers.parseEther('4.75'),  // amountBMin (5% slippage)
    UP_ADDRESS,                // to
    deadline                   // deadline
  ]);
  
  console.log('Router calldata:', addLiquidityData.substring(0, 100) + '...');
  
  // Encode UP.execute with LYX value
  const upExecuteData2 = up.interface.encodeFunctionData('execute', [
    0, // CALL
    ROUTER_ADDRESS,
    LYX_AMOUNT,  // Send LYX with the call
    addLiquidityData
  ]);
  
  console.log('Executing...');
  
  // Execute via KeyManager
  const tx = await keyManager.execute(upExecuteData2, {
    gasLimit: 800000
  });
  
  console.log('Transaction sent:', tx.hash);
  console.log('Waiting for confirmation...');
  
  const receipt = await tx.wait();
  console.log('\n✅ Liquidity added successfully!');
  console.log('Gas used:', receipt.gasUsed.toString());
  console.log('Block:', receipt.blockNumber);
  console.log('');
  console.log('Explorer link:');
  console.log(`https://explorer.execution.mainnet.lukso.network/tx/${tx.hash}`);
}

addLiquidity().catch(err => {
  console.error('❌ Error:', err.message);
  if (err.data) console.error('Error data:', err.data);
});