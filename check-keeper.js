const { ethers } = require('ethers');

const STAKEWISE_VAULT = '0x8A93A876912c9F03F88Bc9114847cf5b63c89f56';
// Keeper contract address (need to find this)
const KEEPER = '0x6B5815467da09DaA7DC83Db21c9239d98Bb487b5'; // Mainnet keeper

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

const KEEPER_ABI = [
  "function rewardsRoot() external view returns (bytes32)",
  "function rewardsNonce() external view returns (uint64)",
  "function rewards(address vault) external view returns (int192 assets, uint64 nonce)",
  "function isHarvestRequired(address vault) external view returns (bool)",
  "function canHarvest(address vault) external view returns (bool)"
];

async function checkKeeper() {
  const keeper = new ethers.Contract(KEEPER, KEEPER_ABI, provider);
  
  console.log('Checking StakeWise Keeper...\n');
  
  try {
    const root = await keeper.rewardsRoot();
    const nonce = await keeper.rewardsNonce();
    const reward = await keeper.rewards(STAKEWISE_VAULT);
    const harvestRequired = await keeper.isHarvestRequired(STAKEWISE_VAULT);
    const canHarvest = await keeper.canHarvest(STAKEWISE_VAULT);
    
    console.log('Rewards Root:', root);
    console.log('Rewards Nonce:', nonce.toString());
    console.log('Vault reward assets:', reward.assets.toString());
    console.log('Vault reward nonce:', reward.nonce.toString());
    console.log('Harvest required:', harvestRequired);
    console.log('Can harvest:', canHarvest);
    
  } catch (err) {
    console.error('Error:', err.message);
    console.log('Keeper address might be wrong');
  }
}

checkKeeper().catch(console.error);
