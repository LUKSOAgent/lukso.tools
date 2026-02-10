const { ethers } = require('ethers');

// Cross-chain wallet credentials
const walletKey = '0xREDACTED_PRIVATE_KEY_2';
const walletAddress = '0x899C7642802E294857b19754a2377F8e74dA9319';
const recipient = '0x820CB7D79A15a66Cb0247fB3d5a9AC2f1644938B';

// Base network
const provider = new ethers.JsonRpcProvider('https://base.publicnode.com');
const wallet = new ethers.Wallet(walletKey, provider);

// WETH and USDC on Base
const WETH = ethers.getAddress('0x4200000000000000000000000000000000000006');
const USDC = ethers.getAddress('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913');

// Uniswap V3 Router on Base
const SWAP_ROUTER = ethers.getAddress('0x2626664c2603336e57b271c5c0b26f421741e481');
const QUOTER = ethers.getAddress('0x3d4e44eb1374240ce5f1b871ab261cd16335eb61');

// ABI fragments
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

const ROUTER_ABI = [
  "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

const QUOTER_ABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut)"
];

async function sendUSDC() {
  try {
    console.log('Wallet:', walletAddress);
    console.log('Recipient:', recipient);
    
    // Check USDC balance
    const usdcContract = new ethers.Contract(USDC, ERC20_ABI, wallet);
    const usdcBalance = await usdcContract.balanceOf(walletAddress);
    console.log('USDC balance:', ethers.formatUnits(usdcBalance, 6));
    
    if (usdcBalance === 0n) {
      console.log('No USDC to send!');
      return;
    }
    
    // Send USDC to recipient
    console.log('Sending USDC to recipient...');
    const transferTx = await usdcContract.transfer(recipient, usdcBalance);
    const transferReceipt = await transferTx.wait();
    console.log('Transfer complete! TX:', transferReceipt.hash);
    console.log('Sent', ethers.formatUnits(usdcBalance, 6), 'USDC to', recipient);
    
  } catch(e) {
    console.error('Error:', e.message);
    if (e.code) console.error('Code:', e.code);
  }
}

sendUSDC();
