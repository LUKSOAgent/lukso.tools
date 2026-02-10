const { ethers } = require('ethers');

const UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const STAKINGVERSE_VAULT = '0x9F49a95b0c3c9e2A6c77a16C177928294c0F6F04';
const SLYX_TOKEN = '0x8a3982f0a7d154d11a5f43eec7f50e52ebbc8f7d';

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const VAULT_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function totalShares() external view returns (uint256)",
  "function totalAssets() external view returns (uint256)"
];

const SLYX_ABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

async function checkBalances() {
  const vault = new ethers.Contract(STAKINGVERSE_VAULT, VAULT_ABI, provider);
  const sLyx = new ethers.Contract(SLYX_TOKEN, SLYX_ABI, provider);
  
  const upStaked = await vault.balanceOf(UP);
  const sLyxBalance = await sLyx.balanceOf(UP);
  const vaultShares = await vault.totalShares();
  const vaultAssets = await vault.totalAssets();
  
  console.log('UP staked in vault:', ethers.formatEther(upStaked), 'LYX');
  console.log('UP sLYX balance:', ethers.formatEther(sLyxBalance), 'sLYX');
  console.log('Vault total shares:', ethers.formatEther(vaultShares));
  console.log('Vault total assets:', ethers.formatEther(vaultAssets), 'LYX');
  
  const upBalance = await provider.getBalance(UP);
  console.log('\nUP native LYX:', ethers.formatEther(upBalance), 'LYX');
}

checkBalances().catch(console.error);
