const { ethers } = require('ethers');

const CONTROLLER_PK = '0xREDACTED_PRIVATE_KEY_1';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const STAKINGVERSE_VAULT = '0x9F49a95b0c3c9e2A6c77a16C177928294c0F6F04';

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(CONTROLLER_PK, provider);

const VAULT_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function pendingBalanceOf(address account) external view returns (uint256)",
  "function claimableBalanceOf(address account) external view returns (uint256)",
  "function withdraw(uint256 amount, address beneficiary) external",
  "function claim(uint256 amount, address beneficiary) external"
];

async function withdrawAndClaim() {
  console.log('💰 Withdrawing staked LYX to native LYX...\n');
  
  const vault = new ethers.Contract(STAKINGVERSE_VAULT, VAULT_ABI, wallet);
  
  const staked = await vault.balanceOf(CONTROLLER);
  console.log('Controller staked LYX:', ethers.formatEther(staked), 'LYX');
  
  const balanceBefore = await provider.getBalance(CONTROLLER);
  console.log('Controller native LYX before:', ethers.formatEther(balanceBefore), 'LYX');
  
  // Step 1: Withdraw (creates pending withdrawal)
  console.log('\n📤 Step 1: Withdrawing staked LYX...');
  try {
    const tx1 = await vault.withdraw(staked, CONTROLLER, { gasLimit: 300000 });
    console.log('⏳ Withdraw tx:', tx1.hash);
    await tx1.wait();
    console.log('✅ Withdraw requested!');
    
    // Check pending balance
    const pending = await vault.pendingBalanceOf(CONTROLLER);
    console.log('Pending withdrawal:', ethers.formatEther(pending), 'LYX');
    
    // Check claimable balance
    const claimable = await vault.claimableBalanceOf(CONTROLLER);
    console.log('Claimable:', ethers.formatEther(claimable), 'LYX');
    
    if (claimable > 0) {
      // Step 2: Claim (if funds are available)
      console.log('\n📤 Step 2: Claiming native LYX...');
      const tx2 = await vault.claim(claimable, CONTROLLER, { gasLimit: 300000 });
      console.log('⏳ Claim tx:', tx2.hash);
      await tx2.wait();
      console.log('✅ Claimed!');
      
      const balanceAfter = await provider.getBalance(CONTROLLER);
      console.log('\nController native LYX after:', ethers.formatEther(balanceAfter), 'LYX');
      console.log('Gained:', ethers.formatEther(balanceAfter - balanceBefore), 'LYX');
    } else {
      console.log('\n⚠️ No funds claimable yet. Oracle needs to process the withdrawal.');
      console.log('Check back later and call claim() when funds are available.');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

withdrawAndClaim().catch(console.error);
