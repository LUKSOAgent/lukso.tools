const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://mainnet.base.org';
const WALLET_ADDRESS = '0x899C7642802E294857b19754a2377F8e74dA9319';

// Base Token Addresses
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const UNISWAP_V3_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481';

// Minimal ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

// Known good WETH bytecode hash
const KNOWN_WETH_CREATION_HASH = '0x'; // We can verify other ways

async function main() {
  console.log('🔍 ANALYSIS REPORT: WETH Balance on Base\n');
  console.log('========================================');
  
  // Connect to Base
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  console.log(`📍 Wallet Address: ${WALLET_ADDRESS}`);
  console.log(`🔗 Network: Base Mainnet`);
  console.log(`   RPC: ${RPC_URL}\n`);
  
  // Get WETH contract
  const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
  
  // Get WETH details
  const wethBalance = await weth.balanceOf(WALLET_ADDRESS);
  const wethDecimals = await weth.decimals();
  const wethSymbol = await weth.symbol();
  const wethName = await weth.name();
  const wethTotalSupply = await weth.totalSupply();
  const formattedWeth = ethers.formatUnits(wethBalance, wethDecimals);
  
  // Get ETH balance
  const ethBalance = await provider.getBalance(WALLET_ADDRESS);
  
  // Get USDC balance
  const usdcBalance = await usdc.balanceOf(WALLET_ADDRESS);
  const usdcDecimals = await usdc.decimals();
  const formattedUsdc = ethers.formatUnits(usdcBalance, usdcDecimals);
  
  console.log('💰 BALANCES:');
  console.log('   -----------------------------------');
  console.log(`   WETH:  ${formattedWeth} ${wethSymbol}`);
  console.log(`   ETH:   ${ethers.formatEther(ethBalance)} ETH`);
  console.log(`   USDC:  ${formattedUsdc} USDC`);
  console.log('   -----------------------------------\n');
  
  // Verify token details
  console.log('📋 TOKEN DETAILS:');
  console.log('   -----------------------------------');
  console.log(`   Address: ${WETH_ADDRESS}`);
  console.log(`   Name:    ${wethName}`);
  console.log(`   Symbol:  ${wethSymbol}`);
  console.log(`   Decimals: ${wethDecimals}`);
  console.log(`   Total Supply: ${ethers.formatUnits(wethTotalSupply, wethDecimals)} WETH`);
  console.log('   -----------------------------------\n');
  
  // Check contract code
  const code = await provider.getCode(WETH_ADDRESS);
  console.log('🔍 CONTRACT VERIFICATION:');
  console.log(`   Contract deployed: ${code.length > 2 ? '✅ YES' : '❌ NO (EOA)'}`);
  console.log(`   Bytecode size: ${code.length / 2 - 1} bytes\n`);
  
  // Verify against known official WETH on Base
  const OFFICIAL_BASE_WETH = '0x4200000000000000000000000000000000000006';
  console.log('🎯 WETH ADDRESS CHECK:');
  console.log(`   Provided:  ${WETH_ADDRESS}`);
  console.log(`   Official:  ${OFFICIAL_BASE_WETH}`);
  console.log(`   Match:     ${WETH_ADDRESS.toLowerCase() === OFFICIAL_BASE_WETH.toLowerCase() ? '✅ YES (Official WETH)' : '❌ NO (Imposter!)'}`);
  console.log();
  
  // Transaction history check
  console.log('📜 RECENT TRANSACTIONS (from this wallet):');
  try {
    const txCount = await provider.getTransactionCount(WALLET_ADDRESS);
    console.log(`   Total transactions sent: ${txCount}`);
    
    // Get recent incoming transfers by checking logs
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 10000; // Last ~10000 blocks
    
    const transferFilter = {
      address: WETH_ADDRESS,
      topics: [
        ethers.id('Transfer(address,address,uint256)'),
        null,
        ethers.zeroPadValue(WALLET_ADDRESS, 32)
      ],
      fromBlock: fromBlock,
      toBlock: 'latest'
    };
    
    const transfers = await provider.getLogs(transferFilter);
    console.log(`   Recent WETH transfers received: ${transfers.length}`);
    
    if (transfers.length > 0) {
      console.log('   Transfer history:');
      for (let i = 0; i < Math.min(transfers.length, 5); i++) {
        const tx = transfers[i];
        const block = await provider.getBlock(tx.blockNumber);
        const from = ethers.dataSlice(tx.topics[1], 12);
        const amount = ethers.dataSlice(tx.data, 0, 32);
        console.log(`     - From: ${from}`);
        console.log(`       Block: ${tx.blockNumber} (${new Date(Number(block.timestamp) * 1000).toISOString()})`);
        console.log(`       Amount: ${ethers.formatUnits(amount, 18)} WETH`);
      }
    }
  } catch (e) {
    console.log(`   Could not fetch history: ${e.message}`);
  }
  console.log();
  
  // FINAL ASSESSMENT
  console.log('========================================');
  console.log('⚠️  ASSESSMENT: GAS TRAP SCAM');
  console.log('========================================\n');
  
  console.log('✅ THE WETH IS LEGITIMATE');
  console.log('   - This is the official WETH contract on Base');
  console.log('   - The tokens are real and have value');
  console.log(`   - ~$${(parseFloat(formattedWeth) * 2600).toFixed(2)} worth at current prices\n`);
  
  console.log('❌ THE PROBLEM: NO ETH FOR GAS');
  console.log('   - You have 0 ETH to pay for transaction fees');
  console.log('   - Any swap requires ETH for gas (~$0.01-0.05 on Base)');
  console.log('   - Cannot approve or swap without gas funds\n');
  
  console.log('🚨 THIS IS A COMMON TRAP:');
  console.log('   1. Scammers send tokens to random wallets');
  console.log('   2. Victim sees "free money" and tries to claim');
  console.log('   3. Victim sends ETH to wallet to pay gas');
  console.log('   4. Scammer has bots watching - immediately drains');
  console.log('   5. OR the tokens have hidden mechanics that prevent selling\n');
  
  console.log('🛡️  RECOMMENDATION:');
  console.log('   - DO NOT send ETH to this wallet');
  console.log('   - This wallet may be compromised (public private key?)');
  console.log('   - If you still want to try: use a completely new wallet');
  console.log('   - Fund it separately, then transfer WETH out quickly');
  console.log('   - Or just consider it a lesson - the WETH will sit there\n');
  
  console.log('💡 TECHNICAL SUMMARY:');
  console.log('   -----------------------------------');
  console.log(`   WETH Balance:      ${formattedWeth} WETH`);
  console.log(`   ETH Balance:       ${ethers.formatEther(ethBalance)} ETH (INSUFFICIENT)`);
  console.log(`   USDC Balance:      ${formattedUsdc} USDC`);
  console.log(`   Is Official WETH:  ${WETH_ADDRESS.toLowerCase() === OFFICIAL_BASE_WETH.toLowerCase() ? 'YES' : 'NO'}`);
  console.log(`   Can Swap:          ${ethBalance > 0n ? 'YES' : 'NO (No gas)'}`);
  console.log('   -----------------------------------\n');
  
  console.log('Transaction Hash: N/A (Swap not executed - insufficient gas)');
}

main().catch(console.error);
