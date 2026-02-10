const { ethers } = require('ethers');

const EOA = '0x899C7642802E294857b19754a2377F8e74dA9319';
const STAKEWISE_VAULT = '0x8A93A876912c9F03F88Bc9114847cf5b63c89f56';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

const VAULT_ABI = [
  "function getShares(address account) external view returns (uint256)",
  "function totalAssets() external view returns (uint256)",
  "function totalShares() external view returns (uint256)",
  "function capacity() external view returns (uint256)",
  "function withdrawableAssets() external view returns (uint256)",
  "function isStateUpdateRequired() external view returns (bool)"
];

async function checkVault() {
  const vault = new ethers.Contract(STAKEWISE_VAULT, VAULT_ABI, provider);
  
  console.log('Checking StakeWise vault state...\n');
  
  const totalAssets = await vault.totalAssets();
  const totalShares = await vault.totalShares();
  const capacity = await vault.capacity();
  const withdrawable = await vault.withdrawableAssets();
  const stateUpdateRequired = await vault.isStateUpdateRequired();
  const myShares = await vault.getShares(EOA);
  
  console.log('Total assets:', ethers.formatEther(totalAssets), 'ETH');
  console.log('Total shares:', ethers.formatEther(totalShares));
  console.log('Capacity:', ethers.formatEther(capacity), 'ETH');
  console.log('Withdrawable:', ethers.formatEther(withdrawable), 'ETH');
  console.log('State update required:', stateUpdateRequired);
  console.log('My shares:', ethers.formatEther(myShares));
  
  // Check vault code
  const code = await provider.getCode(STAKEWISE_VAULT);
  console.log('\nVault code size:', code.length / 2 - 1, 'bytes');
}

checkVault().catch(console.error);
