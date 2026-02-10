const { ethers } = require('ethers');

const walletAddress = '0x899C7642802E294857b19754a2377F8e74dA9319';
const walletKey = '0xREDACTED_PRIVATE_KEY_2';

const WETH = ethers.getAddress('0x4200000000000000000000000000000000000006');
const USDC = ethers.getAddress('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913');
const SWAP_ROUTER = ethers.getAddress('0x2626664c2603336e57b271c5c0b26f421741e481');

const provider = new ethers.JsonRpcProvider('https://base.publicnode.com');
const wallet = new ethers.Wallet(walletKey, provider);

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const ROUTER_ABI = [
  "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

async function sellAllWETH() {
  try {
    // Check WETH balance
    const weth = new ethers.Contract(WETH, ERC20_ABI, wallet);
    const wethBalance = await weth.balanceOf(walletAddress);
    console.log('WETH balance:', ethers.formatEther(wethBalance));
    
    if (wethBalance === 0n) {
      console.log('No WETH to sell');
      return;
    }
    
    // Leave a tiny bit for gas (WETH unwrapping/approvals)
    const sellAmount = wethBalance - ethers.parseEther('0.001'); // Keep 0.001 for gas
    console.log('Selling:', ethers.formatEther(sellAmount), 'WETH');
    
    // Approve router
    console.log('Approving router...');
    const approveTx = await weth.approve(SWAP_ROUTER, sellAmount);
    await approveTx.wait();
    console.log('Approved!');
    
    // Swap WETH to USDC
    const router = new ethers.Contract(SWAP_ROUTER, ROUTER_ABI, wallet);
    const swapParams = {
      tokenIn: WETH,
      tokenOut: USDC,
      fee: 500, // 0.05%
      recipient: walletAddress,
      amountIn: sellAmount,
      amountOutMinimum: 0, // Accept any amount
      sqrtPriceLimitX96: 0
    };
    
    console.log('Executing swap...');
    const swapTx = await router.exactInputSingle(swapParams);
    const swapReceipt = await swapTx.wait();
    console.log('Swap complete! TX:', swapReceipt.hash);
    
    // Check final USDC balance
    const usdc = new ethers.Contract(USDC, ERC20_ABI, wallet);
    const usdcBalance = await usdc.balanceOf(walletAddress);
    console.log('Final USDC balance:', ethers.formatUnits(usdcBalance, 6));
    
  } catch(e) {
    console.error('Error:', e.message);
    if (e.code) console.error('Code:', e.code);
  }
}

sellAllWETH();
