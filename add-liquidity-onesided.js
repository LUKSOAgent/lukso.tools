const { ethers } = require('ethers');
const fs = require('fs');

const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const CONTROLLER_ADDRESS = '0xE093A714960da1bF297522617BfC08132b62B86a';
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const AGENTPO_ADDRESS = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const ROUTER_ADDRESS = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';

const LSP7_ABI = [
  'function transfer(address from, address to, uint256 amount, bool force, bytes memory data)',
  'function authorizeOperator(address operator, uint256 amount, bytes memory operatorNotificationData)',
  'function balanceOf(address tokenOwner) view returns (uint256)'
];

const UP_ABI = [
  'function execute(uint256 operation, address to, uint256 value, bytes calldata data) returns (bytes memory)'
];

const KEY_MANAGER_ABI = [
  'function execute(bytes calldata payload) returns (bytes memory)'
];

async function setupAndAddLiquidity() {
  console.log('💧 Adding One-Sided AGENTPO Liquidity\n');
  
  // Check balances
  const controllerLYX = await provider.getBalance(CONTROLLER_ADDRESS);
  const upLYX = await provider.getBalance(UP_ADDRESS);
  
  console.log('Balances:');
  console.log('  Controller LYX:', ethers.formatEther(controllerLYX));
  console.log('  UP LYX:', ethers.formatEther(upLYX));
  
  const agentpo = new ethers.Contract(AGENTPO_ADDRESS, LSP7_ABI, provider);
  const upAgentpoBalance = await agentpo.balanceOf(UP_ADDRESS);
  const controllerAgentpoBalance = await agentpo.balanceOf(CONTROLLER_ADDRESS);
  
  console.log('  UP AGENTPO:', ethers.formatEther(upAgentpoBalance));
  console.log('  Controller AGENTPO:', ethers.formatEther(controllerAgentpoBalance));
  console.log('');
  
  const amount = ethers.parseEther('100000');
  
  // Step 1: Transfer AGENTPO from UP to Controller
  if (controllerAgentpoBalance < amount) {
    console.log('Step 1: Transferring AGENTPO from UP to Controller...');
    
    const transferData = agentpo.interface.encodeFunctionData('transfer', [
      UP_ADDRESS,
      CONTROLLER_ADDRESS,
      amount,
      true,  // Force - controller doesn't implement LSP1
      '0x'   // Empty data
    ]);
    
    const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
    const upExecuteData = up.interface.encodeFunctionData('execute', [
      0,
      AGENTPO_ADDRESS,
      0,
      transferData
    ]);
    
    const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
    const tx1 = await keyManager.execute(upExecuteData);
    console.log('  Tx:', tx1.hash);
    await tx1.wait();
    console.log('  ✅ Transferred!\n');
  } else {
    console.log('✅ Controller already has AGENTPO\n');
  }
  
  // Step 2: Authorize Router from Controller
  console.log('Step 2: Authorizing Router from Controller...');
  const agentpoWithWallet = new ethers.Contract(AGENTPO_ADDRESS, LSP7_ABI, wallet);
  const authTx = await agentpoWithWallet.authorizeOperator(ROUTER_ADDRESS, amount, '0x', {
    gasLimit: 200000
  });
  console.log('  Tx:', authTx.hash);
  await authTx.wait();
  console.log('  ✅ Router authorized!\n');
  
  // Step 3: Add liquidity directly from Controller
  console.log('Step 3: Adding liquidity...');
  
  const routerAbi = [
    'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)'
  ];
  const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, wallet);
  
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const ethAmount = ethers.parseEther('1'); // Use 1 LYX for gas efficiency
  
  const tx3 = await router.addLiquidityETH(
    AGENTPO_ADDRESS,
    amount,
    ethers.parseEther('95000'), // 5% slippage
    ethers.parseEther('0.95'),  // 5% slippage
    UP_ADDRESS, // LP tokens go to UP
    deadline,
    {
      value: ethAmount,
      gasLimit: 500000
    }
  );
  
  console.log('  Tx:', tx3.hash);
  await tx3.wait();
  console.log('  ✅ Liquidity added!\n');
  
  console.log('🎉 SUCCESS!');
  console.log('Explorer:', `https://explorer.execution.mainnet.lukso.network/tx/${tx3.hash}`);
}

setupAndAddLiquidity().catch(err => {
  console.error('❌ Error:', err.message);
});