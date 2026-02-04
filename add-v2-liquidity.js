const { ethers } = require('ethers');
const fs = require('fs');

const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const ROUTER = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';

const ROUTER_ABI = ['function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)'];
const LSP7_ABI = ['function authorizeOperator(address operator, uint256 amount, bytes memory operatorNotificationData)'];

async function addLiquidityV2() {
  console.log('💧 Adding V2 Liquidity with Native LYX\n');
  
  // Check balances
  const lyx = await provider.getBalance(CONTROLLER);
  console.log('Controller LYX:', ethers.formatEther(lyx));
  
  if (lyx < ethers.parseEther('1')) {
    console.log('❌ Not enough LYX');
    return;
  }
  
  // Authorize Router for AGENTPO
  console.log('\n1. Authorizing Router for 50000 AGENTPO...');
  const agentpo = new ethers.Contract(AGENTPO, LSP7_ABI, wallet);
  await (await agentpo.authorizeOperator(ROUTER, ethers.parseEther('50000'), '0x', { gasLimit: 200000 })).wait();
  console.log('   ✅ Done');
  
  // Add liquidity with native LYX
  console.log('2. Adding liquidity...');
  console.log('   AGENTPO: 50000');
  console.log('   LYX: 1');
  
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);
  
  const tx = await router.addLiquidityETH(
    AGENTPO,
    ethers.parseEther('50000'), // 50k AGENTPO
    ethers.parseEther('45000'), // 10% slippage
    ethers.parseEther('0.9'),   // 10% slippage
    CONTROLLER,
    Math.floor(Date.now() / 1000) + 3600,
    {
      value: ethers.parseEther('1'), // 1 LYX
      gasLimit: 1000000
    }
  );
  
  console.log('   Tx:', tx.hash);
  
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log('\n✅ V2 LIQUIDITY ADDED WITH LYX!');
    console.log('Gas:', receipt.gasUsed.toString());
    console.log('https://explorer.execution.mainnet.lukso.network/tx/' + tx.hash);
  } else {
    console.log('\n❌ Failed');
  }
}

addLiquidityV2().catch(err => console.error('❌', err.message));