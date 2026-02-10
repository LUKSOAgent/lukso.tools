const { ethers } = require('ethers');

const UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

async function checkUPBalance() {
  const balance = await provider.getBalance(UP);
  console.log('UP Balance:', ethers.formatEther(balance), 'LYX');
  console.log('Requested to stake: 1120 LYX');
  
  const hasEnough = parseFloat(ethers.formatEther(balance)) >= 1120;
  console.log('Has enough:', hasEnough);
  
  if (!hasEnough) {
    console.log('Shortfall:', 1120 - parseFloat(ethers.formatEther(balance)), 'LYX');
  }
}

checkUPBalance();
