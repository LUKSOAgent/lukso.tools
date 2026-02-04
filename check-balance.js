const { ethers } = require('ethers');
const fs = require('fs');

// Read credentials
const credsFile = fs.readFileSync('.credentials', 'utf8');
const lines = credsFile.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const upAddress = '0x293E96ebbf264ed7715cff2b67850517De70232a';

async function checkBalance() {
  try {
    const balance = await provider.getBalance(upAddress);
    console.log('LYX Balance:', ethers.formatEther(balance), 'LYX');
    
    // Also check potato balance
    const potatoABI = ['function balanceOf(address tokenOwner) external view returns (uint256)'];
    const potatoContract = new ethers.Contract('0x80d898c5a3a0b118a0c8c8adcdbb260fc687f1ce', potatoABI, provider);
    
    const potatoBalance = await potatoContract.balanceOf(upAddress);
    console.log('Potato Balance:', ethers.formatEther(potatoBalance), 'POTATO');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBalance();