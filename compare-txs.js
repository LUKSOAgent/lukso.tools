const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const JORDY_TX = '0x81195750a4ec859286f91e95b2b9697cd35513081da314aed05a4c5b10b0b2c0';
const MY_TX = '0xe342622022d790b6bb693facfb67ba58fe7f993e6505efcda405afd6588092fd';

async function compare() {
  console.log('🔍 Comparing Transactions\n');
  
  const jordyTx = await provider.getTransaction(JORDY_TX);
  const myTx = await provider.getTransaction(MY_TX);
  
  console.log('Jordy Transaction:');
  console.log('  From:', jordyTx.from);
  console.log('  To:', jordyTx.to);
  console.log('  Value:', ethers.formatEther(jordyTx.value), 'LYX');
  console.log('  Gas Limit:', jordyTx.gasLimit.toString());
  console.log('  Gas Price:', jordyTx.gasPrice?.toString() || 'N/A');
  console.log('  Data length:', jordyTx.data.length);
  console.log('');
  
  console.log('My Transaction:');
  console.log('  From:', myTx.from);
  console.log('  To:', myTx.to);
  console.log('  Value:', ethers.formatEther(myTx.value), 'LYX');
  console.log('  Gas Limit:', myTx.gasLimit.toString());
  console.log('  Gas Price:', myTx.gasPrice?.toString() || 'N/A');
  console.log('  Data length:', myTx.data.length);
  console.log('');
  
  // Decode Jordy's input
  console.log('Decoding Jordy input:');
  const routerAbi = [
    'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)'
  ];
  
  const iface = new ethers.Interface(routerAbi);
  
  try {
    const decoded = iface.parseTransaction({ data: jordyTx.data, value: jordyTx.value });
    console.log('  Function:', decoded.name);
    console.log('  Token:', decoded.args.token);
    console.log('  Amount Token Desired:', ethers.formatEther(decoded.args.amountTokenDesired));
    console.log('  Amount Token Min:', ethers.formatEther(decoded.args.amountTokenMin));
    console.log('  Amount ETH Min:', ethers.formatEther(decoded.args.amountETHMin));
    console.log('  To:', decoded.args.to);
    console.log('  Deadline:', new Date(Number(decoded.args.deadline) * 1000).toISOString());
  } catch (e) {
    console.log('  Could not decode:', e.message);
  }
  
  console.log('');
  console.log('Key Differences:');
  console.log('1. Jordy used token:', '0xdf9124ee97d7a8eb8fe845b6c6ee8a8d75b55a57');
  console.log('2. I used token:', '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016');
  console.log('3. Different amounts');
  console.log('');
  
  // Check the token Jordy used
  const tokenAbi = ['function name() view returns (string)', 'function symbol() view returns (string)'];
  const token = new ethers.Contract('0xdf9124ee97d7a8eb8fe845b6c6ee8a8d75b55a57', tokenAbi, provider);
  
  try {
    const name = await token.name();
    const symbol = await token.symbol();
    console.log('Token Jordy used:', name, '(' + symbol + ')');
  } catch (e) {
    console.log('Could not get token info:', e.message);
  }
}

compare();