const { ethers } = require('ethers');

const CONTROLLER_PK = '0xREDACTED_PRIVATE_KEY_1';
const UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const STAKINGVERSE_VAULT = '0x9F49a95b0c3c9e2A6c77a16C177928294c0F6F04';
const SLYX_TOKEN = '0x8a3982f0a7d154d11a5f43eec7f50e52ebbc8f7d';

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(CONTROLLER_PK, provider);

const KEY_MANAGER_ABI = [
  "function execute(bytes calldata payload) external payable returns (bytes memory)"
];

const UP_ABI = [
  "function execute(uint256 operation, address to, uint256 value, bytes calldata data) external payable returns (bytes memory)"
];

const VAULT_ABI = [
  "function transferStake(address to, uint256 amount, bytes calldata data) external",
  "function balanceOf(address account) external view returns (uint256)"
];

const SLYX_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function getNativeTokenValue(uint256 sLyxAmount) external view returns (uint256)"
];

async function transferStakeToMintSLYX() {
  const amount = ethers.parseEther('10'); // 10 LYX worth of staked balance
  
  console.log('🪙 Transferring staked LYX to sLYX contract to mint sLYX...\n');
  
  const vault = new ethers.Contract(STAKINGVERSE_VAULT, VAULT_ABI, provider);
  const sLyx = new ethers.Contract(SLYX_TOKEN, SLYX_ABI, provider);
  
  const stakedBefore = await vault.balanceOf(UP);
  const sLyxBefore = await sLyx.balanceOf(UP);
  
  console.log('UP staked before:', ethers.formatEther(stakedBefore), 'LYX');
  console.log('UP sLYX before:', ethers.formatEther(sLyxBefore), 'sLYX');
  
  // Transfer staked LYX to SLYX_TOKEN address - this will mint sLYX
  const vaultInterface = new ethers.Interface(VAULT_ABI);
  const transferCalldata = vaultInterface.encodeFunctionData('transferStake', [
    SLYX_TOKEN, // to = sLYX contract (triggers mint)
    amount,
    '0x'
  ]);
  
  const upInterface = new ethers.Interface(UP_ABI);
  const upCalldata = upInterface.encodeFunctionData('execute', [
    0, // call
    STAKINGVERSE_VAULT,
    0,
    transferCalldata
  ]);
  
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  console.log('\n📤 Transferring staked LYX to sLYX contract...');
  try {
    const tx = await keyManager.execute(upCalldata, { gasLimit: 500000 });
    console.log('⏳ Transaction:', tx.hash);
    await tx.wait();
    console.log('✅ Transfer complete!');
    
    // Check new balances
    const stakedAfter = await vault.balanceOf(UP);
    const sLyxAfter = await sLyx.balanceOf(UP);
    
    console.log('\n📊 After:');
    console.log('UP staked:', ethers.formatEther(stakedAfter), 'LYX');
    console.log('UP sLYX:', ethers.formatEther(sLyxAfter), 'sLYX');
    console.log('sLYX minted:', ethers.formatEther(sLyxAfter - sLyxBefore), 'sLYX');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

transferStakeToMintSLYX().catch(console.error);
