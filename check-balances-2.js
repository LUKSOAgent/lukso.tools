const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const WLYX = '0x2f5d256a172a0ae51ad826996fea5ec5f540c435';

async function checkBalances() {
  console.log('💰 Checking Balances\n');
  
  const lyxBalance = await provider.getBalance(UP_ADDRESS);
  console.log('LYX in UP:', ethers.formatEther(lyxBalance));
  
  const wlyxAbi = ['function balanceOf(address) view returns (uint256)'];
  const wlyx = new ethers.Contract(WLYX, wlyxAbi, provider);
  
  try {
    const wlyxBalance = await wlyx.balanceOf(UP_ADDRESS);
    console.log('WLYX in UP:', ethers.formatEther(wlyxBalance));
  } catch (e) {
    console.log('Error reading WLYX:', e.message);
  }
  
  // Check WLYX contract
  const code = await provider.getCode(WLYX);
  console.log('\nWLYX has code:', code.length > 2 ? '✅ Yes' : '❌ No');
}

checkBalances();