import { ethers } from 'ethers';

const EOA_PK = '0xREDACTED_PRIVATE_KEY_2';
const EOA = '0x899C7642802E294857b19754a2377F8e74dA9319';
const VAULT = '0x8A93A876912c9F03F88Bc9114847cf5b63c89f56';

const SUBGRAPH_URL = 'https://graphs.stakewise.io/mainnet-a/subgraphs/name/stakewise/prod';

async function getHarvestParams() {
  console.log('Fetching harvest params from StakeWise subgraph...\n');
  
  const query = `
    query HarvestParams($address: ID!) {
      harvestParams: vault(id: $address) {
        proof
        canHarvest
        rewardsRoot
        reward: proofReward
        unlockedMevReward: proofUnlockedMevReward
      }
    }
  `;
  
  const response = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { address: VAULT.toLowerCase() }
    })
  });
  
  const data = await response.json();
  console.log('Subgraph response:', JSON.stringify(data, null, 2));
  
  return data.data?.harvestParams;
}

async function stakeWithHarvestParams() {
  const harvestParams = await getHarvestParams();
  
  if (!harvestParams || !harvestParams.canHarvest) {
    console.log('❌ Cannot harvest at this time');
    return;
  }
  
  console.log('\n✅ Got harvest params!');
  console.log('Rewards Root:', harvestParams.rewardsRoot);
  console.log('Reward:', harvestParams.reward);
  console.log('Unlocked MEV:', harvestParams.unlockedMevReward);
  console.log('Proof length:', harvestParams.proof?.length || 0);
  
  // Now use these params to stake
  const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
  const wallet = new ethers.Wallet(EOA_PK, provider);
  
  const vaultAbi = [
    "function updateStateAndDeposit(address receiver, address referrer, tuple(bytes32 rewardsRoot, int160 reward, uint160 unlockedMevReward, bytes32[] proof) harvestParams) external payable returns (uint256 shares)"
  ];
  
  const vault = new ethers.Contract(VAULT, vaultAbi, wallet);
  
  const params = {
    rewardsRoot: harvestParams.rewardsRoot,
    reward: harvestParams.reward,
    unlockedMevReward: harvestParams.unlockedMevReward || '0',
    proof: harvestParams.proof || []
  };
  
  console.log('\n📤 Sending deposit with state update...');
  
  try {
    const tx = await vault.updateStateAndDeposit(
      EOA, // receiver
      ethers.ZeroAddress, // referrer
      params,
      { 
        value: ethers.parseEther('0.01'),
        gasLimit: 500000 
      }
    );
    
    console.log('⏳ Transaction:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Confirmed in block:', receipt.blockNumber);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

stakeWithHarvestParams().catch(console.error);
