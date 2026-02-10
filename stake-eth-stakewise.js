const { ethers } = require('ethers');

// EOA credentials
const EOA_PK = '0xREDACTED_PRIVATE_KEY_2';
const EOA = '0x899C7642802E294857b19754a2377F8e74dA9319';

// StakeWise Vault
const STAKEWISE_VAULT = '0x8A93A876912c9F03F88Bc9114847cf5b63c89f56';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
const wallet = new ethers.Wallet(EOA_PK, provider);

const VAULT_ABI = [
  "function deposit(address receiver, address referrer) external payable returns (uint256 shares)",
  "function getShares(address account) external view returns (uint256)",
  "function totalAssets() external view returns (uint256)",
  "function totalShares() external view returns (uint256)"
];

async function stakeETH() {
  const amount = ethers.parseEther('0.01'); // 0.01 ETH
  
  console.log('🚀 Staking 0.01 ETH in StakeWise vault...\n');
  console.log('EOA:', EOA);
  console.log('Vault:', STAKEWISE_VAULT);
  console.log('Amount:', ethers.formatEther(amount), 'ETH\n');
  
  // Check balance
  const balance = await provider.getBalance(EOA);
  console.log('EOA balance:', ethers.formatEther(balance), 'ETH');
  
  if (balance < amount) {
    console.log('❌ Insufficient balance!');
    return;
  }
  
  const vault = new ethers.Contract(STAKEWISE_VAULT, VAULT_ABI, wallet);
  
  // Check shares before
  const sharesBefore = await vault.getShares(EOA);
  console.log('Shares before:', ethers.formatEther(sharesBefore));
  
  // Deposit ETH
  console.log('\n📤 Depositing ETH...');
  try {
    const tx = await vault.deposit(EOA, ethers.ZeroAddress, { 
      value: amount,
      gasLimit: 300000 
    });
    
    console.log('⏳ Transaction:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Confirmed in block:', receipt.blockNumber);
    
    // Check shares after
    const sharesAfter = await vault.getShares(EOA);
    console.log('\n📊 Shares after:', ethers.formatEther(sharesAfter));
    console.log('Shares received:', ethers.formatEther(sharesAfter - sharesBefore));
    
    console.log('\n🎉 Successfully staked 0.01 ETH!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

stakeETH().catch(console.error);
