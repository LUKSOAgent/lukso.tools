const { ethers } = require('ethers');

const CONTROLLER_PK = '0xREDACTED_PRIVATE_KEY_1';
const UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const STAKINGVERSE_VAULT = '0x9F49a95b0c3c9e2A6c77a16C177928294c0F6F04';

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(CONTROLLER_PK, provider);

async function checkBalance() {
  const balance = await provider.getBalance(wallet.address);
  console.log('Controller balance:', ethers.formatEther(balance), 'LYX');
  console.log('Requested to stake: 1120 LYX');
  console.log('Shortfall:', 1120 - parseFloat(ethers.formatEther(balance)), 'LYX');
}

checkBalance();
