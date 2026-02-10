const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem');
const { base } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_2';
const WALLET = '0x899C7642802E294857b19754a2377F8e74dA9319';
const CLAWNCH = '0xa1F72459dfA10BAD200Ac160eCd78C6b77a747be';
const WETH = '0x4200000000000000000000000000000000000006';

// Uniswap V3 SwapRouter on Base
const SWAP_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const WETH_ABI = [
  { inputs: [{ name: '', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' }
];

const SWAP_ROUTER_ABI = [{
  inputs: [{
    components: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'recipient', type: 'address' },
      { name: 'deadline', type: 'uint256' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMinimum', type: 'uint256' },
      { name: 'sqrtPriceLimitX96', type: 'uint160' }
    ],
    name: 'params',
    type: 'tuple'
  }],
  name: 'exactInputSingle',
  outputs: [{ name: 'amountOut', type: 'uint256' }],
  stateMutability: 'payable',
  type: 'function'
}];

async function approveAndSwap(wethAmount) {
  console.log('Approving WETH for SwapRouter...');
  
  const approveHash = await walletClient.writeContract({
    address: WETH,
    abi: WETH_ABI,
    functionName: 'approve',
    args: [SWAP_ROUTER, wethAmount]
  });
  
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  console.log('Approved:', approveHash);
  
  console.log('Swapping WETH for CLAWNCH via V3 (1% fee)...');
  
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);
  
  const swapHash = await walletClient.writeContract({
    address: SWAP_ROUTER,
    abi: SWAP_ROUTER_ABI,
    functionName: 'exactInputSingle',
    args: [{
      tokenIn: WETH,
      tokenOut: CLAWNCH,
      fee: 10000, // 1% pool
      recipient: WALLET,
      deadline: deadline,
      amountIn: wethAmount,
      amountOutMinimum: 0n,
      sqrtPriceLimitX96: 0n
    }]
  });
  
  console.log('Swap TX:', swapHash);
  await publicClient.waitForTransactionReceipt({ hash: swapHash });
  console.log('Swap confirmed!');
  
  return swapHash;
}

async function main() {
  const wethAmount = parseEther('0.008'); // Use 0.008 WETH to leave some for gas
  await approveAndSwap(wethAmount);
  
  const ERC20_ABI = [{ inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }];
  const claw = await publicClient.readContract({ address: CLAWNCH, abi: ERC20_ABI, functionName: 'balanceOf', args: [WALLET] });
  console.log('CLAWNCH balance:', formatEther(claw));
}

main().catch(console.error);
