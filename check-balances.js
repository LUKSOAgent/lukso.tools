const { ethers } = require('ethers');
const fs = require('fs');

// Load credentials from .credentials file
const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');

const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const CONTROLLER_ADDRESS = '0xE093A714960da1bF297522617BfC08132b62B86a';
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const AGENTPO_ADDRESS = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';

async function checkBalances() {
  console.log('💰 Checking Balances');
  console.log('=====================\n');
  
  const controllerBalance = await provider.getBalance(CONTROLLER_ADDRESS);
  const upBalance = await provider.getBalance(UP_ADDRESS);
  
  console.log('Controller:', CONTROLLER_ADDRESS);
  console.log('  LYX:', ethers.formatEther(controllerBalance));
  console.log('');
  console.log('Universal Profile:', UP_ADDRESS);
  console.log('  LYX:', ethers.formatEther(upBalance));
  console.log('');
  
  // Check AGENTPO balance
  const agentpoAbi = ['function balanceOf(address) view returns (uint256)'];
  const agentpo = new ethers.Contract(AGENTPO_ADDRESS, agentpoAbi, provider);
  const agentpoBalance = await agentpo.balanceOf(UP_ADDRESS);
  
  console.log('AGENTPO Token:', AGENTPO_ADDRESS);
  console.log('  Balance in UP:', ethers.formatEther(agentpoBalance));
  console.log('');
  
  const hasEnoughLYX = parseFloat(ethers.formatEther(controllerBalance)) >= 10;
  console.log(hasEnoughLYX ? '✅ Sufficient LYX for liquidity!' : '❌ Still need more LYX');
  
  return {
    controllerLYX: ethers.formatEther(controllerBalance),
    upLYX: ethers.formatEther(upBalance),
    agentpoBalance: ethers.formatEther(agentpoBalance),
    hasEnoughLYX
  };
}

checkBalances().catch(console.error);