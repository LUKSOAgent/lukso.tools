const ethers = require('ethers');

// Configuration
const RPC_URL = 'https://mainnet.base.org';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_2';
const WALLET_ADDRESS = '0x899C7642802E294857b19754a2377F8e74dA9319';
const TARGET_ADDRESS = '0x820CB7D79A15a66Cb0247fB3d5a9AC2f1644938B';

// Token addresses on Base
const WETH = '0x4200000000000000000000000000000000000006';
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const UNISWAP_V3_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481';

// ABIs
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)'
];

const UNISWAP_V3_ROUTER_ABI = [
  'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
  'function exactInput(tuple(bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum) params) external payable returns (uint256 amountOut)'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('='.repeat(60));
  console.log('WETH to USDC Swap on Base Mainnet');
  console.log('='.repeat(60));
  console.log(`Wallet: ${WALLET_ADDRESS}`);
  console.log(`Target: ${TARGET_ADDRESS}`);
  console.log('');

  // Step 1: Check ETH balance
  console.log('Step 1: Checking ETH balance for gas...');
  const ethBalance = await provider.getBalance(WALLET_ADDRESS);
  console.log(`  ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
  if (ethBalance < ethers.parseEther('0.0001')) {
    console.log('  ⚠️ Warning: Low ETH balance for gas');
  }
  console.log('');

  // Step 2: Check WETH balance
  console.log('Step 2: Checking WETH balance...');
  const wethContract = new ethers.Contract(WETH, ERC20_ABI, wallet);
  const wethBalance = await wethContract.balanceOf(WALLET_ADDRESS);
  const wethDecimals = await wethContract.decimals();
  const wethSymbol = await wethContract.symbol();
  console.log(`  WETH Balance: ${ethers.formatUnits(wethBalance, wethDecimals)} ${wethSymbol}`);
  
  if (wethBalance === 0n) {
    console.log('  ❌ Error: No WETH balance to swap');
    process.exit(1);
  }
  console.log('');

  // Step 3: Check and approve WETH for Uniswap Router
  console.log('Step 3: Checking WETH allowance...');
  const allowance = await wethContract.allowance(WALLET_ADDRESS, UNISWAP_V3_ROUTER);
  console.log(`  Current allowance: ${ethers.formatUnits(allowance, wethDecimals)} WETH`);
  
  if (allowance < wethBalance) {
    console.log('  Approving WETH for Uniswap V3 Router...');
    const approveTx = await wethContract.approve(UNISWAP_V3_ROUTER, wethBalance);
    console.log(`  Approval tx sent: ${approveTx.hash}`);
    await approveTx.wait();
    console.log('  ✅ Approval confirmed');
  } else {
    console.log('  ✅ WETH already approved');
  }
  console.log('');

  // Step 4: Swap WETH to USDC
  console.log('Step 4: Swapping WETH to USDC...');
  const routerContract = new ethers.Contract(UNISWAP_V3_ROUTER, UNISWAP_V3_ROUTER_ABI, wallet);
  
  // 0.05% fee tier is commonly used for WETH/USDC on Base
  const feeTier = 500; // 0.05%
  
  // Set minimum output to 0 for now (in production, use slippage protection)
  const amountOutMinimum = 0;
  const sqrtPriceLimitX96 = 0;
  
  const swapParams = {
    tokenIn: WETH,
    tokenOut: USDC,
    fee: feeTier,
    recipient: WALLET_ADDRESS, // Send to wallet first
    amountIn: wethBalance,
    amountOutMinimum: amountOutMinimum,
    sqrtPriceLimitX96: sqrtPriceLimitX96
  };
  
  console.log(`  Swapping ${ethers.formatUnits(wethBalance, wethDecimals)} WETH...`);
  
  try {
    const swapTx = await routerContract.exactInputSingle(swapParams);
    console.log(`  Swap tx sent: ${swapTx.hash}`);
    const swapReceipt = await swapTx.wait();
    console.log(`  ✅ Swap confirmed in block ${swapReceipt.blockNumber}`);
    
    // Get swap result - check USDC balance
    const usdcContract = new ethers.Contract(USDC, ERC20_ABI, wallet);
    const usdcBalance = await usdcContract.balanceOf(WALLET_ADDRESS);
    const usdcDecimals = await usdcContract.decimals();
    const usdcAmount = ethers.formatUnits(usdcBalance, usdcDecimals);
    console.log(`  USDC Received: ${usdcAmount} USDC`);
    console.log('');
    
    // Step 5: Transfer all USDC to target address
    console.log('Step 5: Transferring USDC to target address...');
    const transferTx = await usdcContract.transfer(TARGET_ADDRESS, usdcBalance);
    console.log(`  Transfer tx sent: ${transferTx.hash}`);
    const transferReceipt = await transferTx.wait();
    console.log(`  ✅ Transfer confirmed in block ${transferReceipt.blockNumber}`);
    console.log('');
    
    // Final report
    console.log('='.repeat(60));
    console.log('TRANSACTION REPORT');
    console.log('='.repeat(60));
    console.log(`Swap Transaction Hash: ${swapTx.hash}`);
    console.log(`USDC Amount Received: ${usdcAmount} USDC`);
    console.log(`Transfer Transaction Hash: ${transferTx.hash}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('  ❌ Swap failed:', error.message);
    console.log('');
    console.log('='.repeat(60));
    console.log('ERROR REPORT');
    console.log('='.repeat(60));
    console.log(`Error: ${error.message}`);
    if (error.data) console.log(`Error data: ${error.data}`);
    console.log('='.repeat(60));
    process.exit(1);
  }
}

main().catch(console.error);
