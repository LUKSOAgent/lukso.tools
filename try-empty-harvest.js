const { ethers } = require('ethers');

const EOA_PK = '0xREDACTED_PRIVATE_KEY_2';
const EOA = '0x899C7642802E294857b19754a2377F8e74dA9319';
const STAKEWISE_VAULT = '0x8A93A876912c9F03F88Bc9114847cf5b63c89f56';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
const wallet = new ethers.Wallet(EOA_PK, provider);

// ABI with updateStateAndDeposit
const VAULT_ABI = [
  "function updateStateAndDeposit(address receiver, address referrer, tuple(bytes32 rewardsRoot, int160 totalAssetsDelta, uint160 unclaimedRewards, uint64 nonce, bytes proof) harvestParams) external payable returns (uint256 shares)",
  "function getShares(address account) external view returns (uint256)"
];

async function tryDepositWithEmptyHarvest() {
  const amount = ethers.parseEther('0.01');
  
  console.log('Trying deposit with empty harvest params...\n');
  
  const vault = new ethers.Contract(STAKEWISE_VAULT, VAULT_ABI, wallet);
  
  // Empty harvest params
  const emptyHarvestParams = {
    rewardsRoot: ethers.ZeroHash,
    totalAssetsDelta: 0,
    unclaimedRewards: 0,
    nonce: 0,
    proof: '0x'
  };
  
  try {
    const tx = await vault.updateStateAndDeposit(EOA, ethers.ZeroAddress, emptyHarvestParams, {
      value: amount,
      gasLimit: 500000
    });
    
    console.log('⏳ Transaction:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Success! Block:', receipt.blockNumber);
    
  } catch (err) {
    console.error('❌ Failed:', err.message);
    console.log('\nThe vault requires valid harvest params from the StakeWise keeper.');
    console.log('Alternative: Use the StakeWise dApp at https://app.stakewise.io');
  }
}

tryDepositWithEmptyHarvest().catch(console.error);
