const { ethers } = require('ethers');
const fs = require('fs');

const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const CONTROLLER_ADDRESS = '0xE093A714960da1bF297522617BfC08132b62B86a';
const AGENTPO_ADDRESS = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const ROUTER_ADDRESS = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';

const ROUTER_ABI = [
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)'
];

async function addLiquidityWithMoreGas() {
  console.log('💧 Adding Liquidity with More Gas\n');
  
  const amount = ethers.parseEther('100000');
  const ethAmount = ethers.parseEther('1');
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
  
  console.log('Parameters:');
  console.log('  Token:', AGENTPO_ADDRESS);
  console.log('  Amount:', ethers.formatEther(amount));
  console.log('  ETH:', ethers.formatEther(ethAmount));
  console.log('  Min Amount:', ethers.formatEther(amount * 95n / 100n));
  console.log('  Min ETH:', ethers.formatEther(ethAmount * 95n / 100n));
  console.log('');
  
  console.log('Sending with 2,000,000 gas limit...\n');
  
  try {
    const tx = await router.addLiquidityETH(
      AGENTPO_ADDRESS,
      amount,
      amount * 95n / 100n, // 5% slippage
      ethAmount * 95n / 100n, // 5% slippage
      CONTROLLER_ADDRESS, // LP tokens to controller
      deadline,
      {
        value: ethAmount,
        gasLimit: 2000000
      }
    );
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...\n');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ SUCCESS! Liquidity added!');
      console.log('Gas used:', receipt.gasUsed.toString());
      console.log('Block:', receipt.blockNumber);
      console.log('');
      console.log('Explorer:');
      console.log(`https://explorer.execution.mainnet.lukso.network/tx/${tx.hash}`);
    } else {
      console.log('❌ Transaction failed (status 0)');
      console.log('Gas used:', receipt.gasUsed.toString());
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.data) console.log('Error data:', error.data);
  }
}

addLiquidityWithMoreGas();