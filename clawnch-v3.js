const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem');
const { base } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_2';
const WALLET = '0x899C7642802E294857b19754a2377F8e74dA9319';
const CLAWNCH_TOKEN = '0xa1F72459dfA10BAD200Ac160eCd78C6b77a747be';
const WETH = '0x4200000000000000000000000000000000000006';
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';

// Uniswap V3 Universal Router on Base
const UNIVERSAL_ROUTER = '0x6fF5693b99212Da76ad316178A184AB56E275C03';

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

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

const ROUTER_ABI = [{
  inputs: [{ name: 'commands', type: 'bytes' }, { name: 'inputs', type: 'bytes[]' }],
  name: 'execute',
  outputs: [],
  stateMutability: 'payable',
  type: 'function'
}];

async function getBalances() {
  const ethBalance = await publicClient.getBalance({ address: WALLET });
  const clawBalance = await publicClient.readContract({
    address: CLAWNCH_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [WALLET]
  });
  
  console.log('ETH balance:', formatEther(ethBalance));
  console.log('CLAWNCH balance:', formatEther(clawBalance));
  return { eth: ethBalance, claw: clawBalance };
}

async function buyClawnchViaV3(ethAmount) {
  console.log(`Buying CLAWNCH with ${ethAmount} ETH via V3...`);
  
  // Use clanker.world or a direct swap - simpler approach via WETH
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);
  
  // For now, just wrap ETH to WETH first
  const WETH_ABI = [{
    inputs: [],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  }];
  
  console.log('Wrapping ETH to WETH...');
  const wrapHash = await walletClient.writeContract({
    address: WETH,
    abi: WETH_ABI,
    functionName: 'deposit',
    value: parseEther(ethAmount)
  });
  
  await publicClient.waitForTransactionReceipt({ hash: wrapHash });
  console.log('Wrapped:', wrapHash);
  
  return wrapHash;
}

async function main() {
  const action = process.argv[2];
  
  if (action === 'balance') {
    await getBalances();
  } else if (action === 'wrap') {
    const amount = process.argv[3] || '0.1';
    await buyClawnchViaV3(amount);
    await getBalances();
  } else {
    console.log('Usage: node clawnch-v3.js balance|wrap <amount>');
  }
}

main().catch(console.error);
