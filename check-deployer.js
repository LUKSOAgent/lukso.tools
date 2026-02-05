const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.mainnet.lukso.network';
const provider = new ethers.JsonRpcProvider(RPC_URL);

const DEPLOYER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const OWNER_OF_OWNER_UP = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

async function check() {
  // Check if deployer is owner of owner UP
  console.log('Deployer:', DEPLOYER);
  console.log('Owner of Owner UP:', OWNER_OF_OWNER_UP);
  console.log('Match:', DEPLOYER.toLowerCase() === OWNER_OF_OWNER_UP.toLowerCase());
  
  // Check deployer code
  const deployerCode = await provider.getCode(DEPLOYER);
  console.log('\nDeployer is EOA:', deployerCode === '0x');
  
  // Check deployer balance
  const balance = await provider.getBalance(DEPLOYER);
  console.log('Deployer LYX balance:', ethers.formatEther(balance));
  
  // Check if owner of owner UP is EOA
  const ownerCode = await provider.getCode(OWNER_OF_OWNER_UP);
  console.log('\nOwner of Owner UP is EOA:', ownerCode === '0x');
  
  // Check balance of owner of owner UP
  const ownerBalance = await provider.getBalance(OWNER_OF_OWNER_UP);
  console.log('Owner of Owner UP LYX balance:', ethers.formatEther(ownerBalance));
}

check().catch(console.error);
