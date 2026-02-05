const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://mainnet.base.org';
const WALLET_ADDRESS = '0x899C7642802E294857b19754a2377F8e74dA9319';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_2';

// Base Token Addresses
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const UNISWAP_V3_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481';

// Minimal ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

// Uniswap V3 Router ABI (minimal)
const ROUTER_ABI = [
  'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'
];

async function main() {
  console.log('🔍 Checking WETH balance on Base...\n');
  
  // Connect to Base
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`📍 Wallet Address: ${WALLET_ADDRESS}`);
  console.log(`🔗 Connected to: Base Mainnet\n`);
  
  // Get WETH contract
  const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
  
  // Check WETH balance
  const wethBalance = await weth.balanceOf(WALLET_ADDRESS);
  const wethDecimals = await weth.decimals();
  const wethSymbol = await weth.symbol();
  const formattedWeth = ethers.formatUnits(wethBalance, wethDecimals);
  
  console.log(`💰 WETH Balance: ${formattedWeth} ${wethSymbol}`);
  console.log(`   Raw: ${wethBalance.toString()}\n`);
  
  // Check native ETH balance (for gas)
  const ethBalance = await provider.getBalance(WALLET_ADDRESS);
  console.log(`⛽ ETH Balance (for gas): ${ethers.formatEther(ethBalance)} ETH\n`);
  
  // Check USDC balance before swap
  const usdcBalanceBefore = await usdc.balanceOf(WALLET_ADDRESS);
  const usdcDecimals = await usdc.decimals();
  console.log(`💵 USDC Balance (before): ${ethers.formatUnits(usdcBalanceBefore, usdcDecimals)} USDC\n`);
  
  if (wethBalance === 0n) {
    console.log('❌ No WETH balance found. Nothing to swap.');
    return;
  }
  
  console.log('🔄 WETH balance detected! Initiating swap to USDC...\n');
  
  // Create router contract with wallet for signing
  const router = new ethers.Contract(UNISWAP_V3_ROUTER, ROUTER_ABI, wallet);
  
  // Approve WETH for router
  console.log('📝 Approving WETH for Uniswap V3 Router...');
  const wethWithWallet = weth.connect(wallet);
  const approveTx = await wethWithWallet.approve(UNISWAP_V3_ROUTER, wethBalance);
  console.log(`   Approval TX: ${approveTx.hash}`);
  await approveTx.wait();
  console.log('   ✅ WETH approved!\n');
  
  // Check allowance
  const allowance = await weth.allowance(WALLET_ADDRESS, UNISWAP_V3_ROUTER);
  console.log(`   Allowance: ${ethers.formatUnits(allowance, wethDecimals)} WETH\n`);
  
  // Prepare swap parameters
  // Using 0.3% fee tier (3000) - most common for WETH/USDC
  const fee = 3000;
  const amountOutMinimum = 0; // WARNING: In production, set a proper slippage tolerance!
  const sqrtPriceLimitX96 = 0;
  
  const params = {
    tokenIn: WETH_ADDRESS,
    tokenOut: USDC_ADDRESS,
    fee: fee,
    recipient: WALLET_ADDRESS,
    amountIn: wethBalance,
    amountOutMinimum: amountOutMinimum,
    sqrtPriceLimitX96: sqrtPriceLimitX96
  };
  
  console.log('🚀 Executing swap...');
  console.log(`   Amount In: ${formattedWeth} WETH`);
  console.log(`   Fee Tier: ${fee / 10000}%`);
  
  try {
    // Execute swap
    const swapTx = await router.exactInputSingle(params, {
      gasLimit: 500000
    });
    
    console.log(`   Swap TX Hash: ${swapTx.hash}`);
    console.log('   ⏳ Waiting for confirmation...\n');
    
    const receipt = await swapTx.wait();
    console.log(`   ✅ Swap confirmed in block ${receipt.blockNumber}!`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}\n`);
    
    // Check USDC balance after swap
    const usdcBalanceAfter = await usdc.balanceOf(WALLET_ADDRESS);
    const usdcReceived = usdcBalanceAfter - usdcBalanceBefore;
    
    console.log('📊 RESULTS:');
    console.log('========================================');
    console.log(`WETH Swapped: ${formattedWeth} WETH`);
    console.log(`Swap TX Hash: ${swapTx.hash}`);
    console.log(`USDC Received: ${ethers.formatUnits(usdcReceived, usdcDecimals)} USDC`);
    console.log(`USDC Balance Now: ${ethers.formatUnits(usdcBalanceAfter, usdcDecimals)} USDC`);
    console.log('========================================\n');
    
    // Check for any suspicious activity
    console.log('🔍 Checking for suspicious patterns...');
    if (receipt.status === 1) {
      console.log('   ✅ Transaction succeeded');
      
      // Check if we received reasonable amount
      const usdcFormatted = parseFloat(ethers.formatUnits(usdcReceived, usdcDecimals));
      const wethFormatted = parseFloat(formattedWeth);
      
      if (usdcFormatted > 0) {
        const rate = usdcFormatted / wethFormatted;
        console.log(`   Rate: ~$${rate.toFixed(2)} per WETH`);
        
        if (rate > 500 && rate < 10000) {
          console.log('   ✅ Rate looks reasonable for WETH/USDC');
        } else {
          console.log('   ⚠️ Unusual rate - might be a token with different value');
        }
      }
      
      // Check WETH balance after (should be 0 or close to 0)
      const wethAfter = await weth.balanceOf(WALLET_ADDRESS);
      console.log(`   WETH remaining: ${ethers.formatUnits(wethAfter, wethDecimals)} WETH`);
      
    } else {
      console.log('   ❌ Transaction failed');
    }
    
  } catch (error) {
    console.error('\n❌ Swap failed!\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.log('\n⚠️ Not enough ETH for gas fees');
    } else if (error.message.includes('TRANSFER_FROM_FAILED')) {
      console.log('\n⚠️ Approval failed or token might be a scam (transfer tax, etc.)');
    } else if (error.message.includes('Too little received')) {
      console.log('\n⚠️ Slippage too high or pool has no liquidity');
    }
    
    // Check if token is actually WETH or something else
    console.log('\n🔍 Investigation:');
    try {
      const code = await provider.getCode(WETH_ADDRESS);
      console.log(`   Contract code at WETH address: ${code.length > 2 ? 'Exists (bytecode)' : 'No code (EOA)'}`);
      
      // Try to call WETH-specific functions
      if (code.length > 2) {
        console.log('   Token contract exists - checking if it behaves like WETH...');
      }
    } catch (e) {
      console.log('   Could not verify contract');
    }
  }
}

main().catch(console.error);
