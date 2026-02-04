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

const ROUTER_ABI = [
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)'
];

const UP_ABI = [
  'function execute(uint256 operation, address to, uint256 value, bytes calldata data) returns (bytes memory)'
];

const KEY_MANAGER_ABI = [
  'function execute(bytes calldata payload) returns (bytes memory)'
];

async function addLiquidityStep4() {
  console.log('💧 Step 4: Adding Liquidity\n');
  
  const AGENTPO_AMOUNT = ethers.parseEther('100000');
  const WLYX_AMOUNT = ethers.parseEther('3');
  
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
  const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  
  const addLiqData = router.interface.encodeFunctionData('addLiquidity', [
    AGENTPO_ADDRESS,
    WLYX,
    AGENTPO_AMOUNT,
    WLYX_AMOUNT,
    ethers.parseEther('95000'), // 5% slippage on AGENTPO
    ethers.parseEther('2.85'),  // 5% slippage on WLYX
    UP_ADDRESS,
    deadline
  ]);
  
  console.log('Calldata ready');
  console.log('Sending transaction...\n');
  
  const upAddLiq = up.interface.encodeFunctionData('execute', [0, ROUTER_ADDRESS, 0, addLiqData]);
  const tx = await keyManager.execute(upAddLiq, { gasLimit: 1000000 });
  
  console.log('Tx sent:', tx.hash);
  console.log('Waiting...\n');
  
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log('✅ SUCCESS! Liquidity added!');
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Block:', receipt.blockNumber);
    console.log('');
    console.log('Explorer:');
    console.log(`https://explorer.execution.mainnet.lukso.network/tx/${tx.hash}`);
  } else {
    console.log('❌ Failed');
  }
}

addLiquidityStep4().catch(err => {
  console.error('❌ Error:', err.message);
});