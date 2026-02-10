const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem');
const { base } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_2';
const WALLET = '0x899C7642802E294857b19754a2377F8e74dA9319';
const CLAWNCH_TOKEN = '0xa1F72459dfA10BAD200Ac160eCd78C6b77a747be';
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';
const WETH = '0x4200000000000000000000000000000000000006';

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

// Buy CLAWNCH via Uniswap V2 Router (simpler than V3 for now)
const UNISWAP_V2_ROUTER = '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24'; // Base Uniswap V2

const ROUTER_ABI = [
  {
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactETHForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'payable',
    type: 'function'
  }
];

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

async function buyClawnch(ethAmount) {
  console.log(`Buying CLAWNCH with ${ethAmount} ETH...`);
  
  const path = [WETH, CLAWNCH_TOKEN];
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);
  const amountOutMin = 0n; // Accept any slippage for now
  
  const hash = await walletClient.writeContract({
    address: UNISWAP_V2_ROUTER,
    abi: ROUTER_ABI,
    functionName: 'swapExactETHForTokens',
    args: [amountOutMin, path, WALLET, deadline],
    value: parseEther(ethAmount)
  });
  
  console.log('Swap TX:', hash);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log('Swap confirmed!');
  
  const balance = await publicClient.readContract({
    address: CLAWNCH_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [WALLET]
  });
  
  console.log('CLAWNCH balance:', formatEther(balance));
  return balance;
}

async function burnClawnch(amount) {
  console.log(`Burning ${formatEther(amount)} CLAWNCH...`);
  
  const hash = await walletClient.writeContract({
    address: CLAWNCH_TOKEN,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [BURN_ADDRESS, amount]
  });
  
  console.log('Burn TX:', hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('Burn confirmed!');
  return hash;
}

async function main() {
  const action = process.argv[2];
  
  if (action === 'buy') {
    const ethAmount = process.argv[3] || '0.1';
    await buyClawnch(ethAmount);
  } else if (action === 'burn') {
    const amount = process.argv[3];
    if (!amount) {
      console.log('Usage: node clawnch-buy-burn.js burn <amount_in_wei>');
      process.exit(1);
    }
    await burnClawnch(BigInt(amount));
  } else {
    console.log('Usage:');
    console.log('  node clawnch-buy-burn.js buy <eth_amount>');
    console.log('  node clawnch-buy-burn.js burn <amount_in_wei>');
  }
}

main().catch(console.error);
