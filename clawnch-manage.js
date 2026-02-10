const { createPublicClient, createWalletClient, http, parseEther, formatEther, encodeFunctionData } = require('viem');
const { base } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_2';
const WALLET = '0x899C7642802E294857b19754a2377F8e74dA9319';
const CLAWNCH = '0xa1F72459dfA10BAD200Ac160eCd78C6b77a747be';
const WETH = '0x4200000000000000000000000000000000000006';
const BURN_ADDR = '0x000000000000000000000000000000000000dEaD';

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
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }], name: 'transfer', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' }
];

// Odos Router on Base
const ODOS_ROUTER = '0x19cEeAd99E8dd6374268F1E6Eea47E8e7a70E595';

async function getBalances() {
  const eth = await publicClient.getBalance({ address: WALLET });
  const weth = await publicClient.readContract({ address: WETH, abi: ERC20_ABI, functionName: 'balanceOf', args: [WALLET] });
  const claw = await publicClient.readContract({ address: CLAWNCH, abi: ERC20_ABI, functionName: 'balanceOf', args: [WALLET] });
  
  console.log('ETH:', formatEther(eth));
  console.log('WETH:', formatEther(weth));
  console.log('CLAWNCH:', formatEther(claw));
  return { eth, weth, claw };
}

async function approveWeth(spender, amount) {
  console.log('Approving WETH...');
  const hash = await walletClient.writeContract({
    address: WETH,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender, amount]
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log('Approved:', hash);
}

async function burnClawnch(amount) {
  console.log(`Burning ${formatEther(amount)} CLAWNCH...`);
  const hash = await walletClient.writeContract({
    address: CLAWNCH,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [BURN_ADDR, amount]
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log('Burned:', hash);
  return hash;
}

async function main() {
  const action = process.argv[2];
  const balances = await getBalances();
  
  if (action === 'burn') {
    const amount = process.argv[3] || balances.claw.toString();
    await burnClawnch(BigInt(amount));
    await getBalances();
  } else if (action === 'balance') {
    // already printed
  }
}

main().catch(console.error);
