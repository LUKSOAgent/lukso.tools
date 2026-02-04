const { ethers } = require('ethers');
const fs = require('fs');

// Read credentials
const credsFile = fs.readFileSync('.credentials', 'utf8');
const lines = credsFile.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const keyManagerAddress = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const upAddress = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const jordyUP = '0x378Be8577ede94b9d4b9F45447F21B826501bab8';

// LSP7 Token Details
const TOKEN_NAME = 'Agent Potato';
const TOKEN_SYMBOL = 'AGENTPO';
const TOKEN_TYPE = 0; // 0 = Token, 1 = NFT
const IS_NFT = false;

// Token distribution
const TOTAL_SUPPLY = ethers.parseEther('1000000'); // 1 million tokens
const MINT_TO_SELF = ethers.parseEther('400000'); // 40% to me
const MINT_TO_JORDY = ethers.parseEther('400000'); // 40% to Jordy
const LIQUIDITY_POOL = ethers.parseEther('200000'); // 20% for liquidity

async function deployToken() {
  console.log('🚀 LSP7 Token Deployment');
  console.log('========================');
  console.log('Token Name:', TOKEN_NAME);
  console.log('Token Symbol:', TOKEN_SYMBOL);
  console.log('Total Supply:', ethers.formatEther(TOTAL_SUPPLY));
  console.log('');
  console.log('Distribution:');
  console.log('  To me:', ethers.formatEther(MINT_TO_SELF), TOKEN_SYMBOL);
  console.log('  To Jordy:', ethers.formatEther(MINT_TO_JORDY), TOKEN_SYMBOL);
  console.log('  For Liquidity:', ethers.formatEther(LIQUIDITY_POOL), TOKEN_SYMBOL);
  console.log('');
  
  console.log('Deployment requires:');
  console.log('1. Deploy LSP7DigitalAsset contract');
  console.log('2. Mint tokens to self and Jordy');
  console.log('3. Add liquidity to Universal Swaps');
  console.log('');
  console.log('Checking LUKSO contracts package...');
}

deployToken();