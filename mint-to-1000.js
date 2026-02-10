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
  "function getNativeTokenValue(uint256 sLyxAmount) external view returns (uint256)",
  "function getExchangeRate() external view returns (uint256)"
];

async function mintToReach1000() {
  console.log('🎯 Minting sLYX to reach 1000 total...\n');
  
  const vault = new ethers.Contract(STAKINGVERSE_VAULT, VAULT_ABI, provider);
  const sLyx = new ethers.Contract(SLYX_TOKEN, SLYX_ABI, provider);
  
  const sLyxBefore = await sLyx.balanceOf(UP);
  const stakedBalance = await vault.balanceOf(UP);
  const exchangeRate = await sLyx.getExchangeRate();
  
  console.log('Current sLYX:', ethers.formatEther(sLyxBefore), 'sLYX');
  console.log('UP staked:', ethers.formatEther(stakedBalance), 'LYX');
  console.log('Exchange rate:', ethers.formatEther(exchangeRate), 'LYX/sLYX');
  
  // Calculate how much more sLYX needed
  const targetSLYX = ethers.parseEther('1000');
  const sLyxNeeded = targetSLYX - sLyxBefore;
  
  if (sLyxNeeded <= 0) {
    console.log('\n✅ Already have 1000+ sLYX!');
    return;
  }
  
  console.log('\nNeeded:', ethers.formatEther(sLyxNeeded), 'sLYX');
  
  // Calculate LYX needed for this sLYX amount
  // LYX = sLYX * exchangeRate
  const lyxNeeded = (sLyxNeeded * exchangeRate) / ethers.parseEther('1');
  console.log('LYX to transfer:', ethers.formatEther(lyxNeeded), 'LYX');
  
  if (lyxNeeded > stakedBalance) {
    console.log('\n❌ Not enough staked LYX!');
    console.log('Max possible:', ethers.formatEther(stakedBalance), 'LYX');
    
    // Calculate max sLYX we can mint
    const maxSLYX = await sLyx.getSLYXTokenValue(stakedBalance);
    console.log('Max sLYX mintable:', ethers.formatEther(maxSLYX), 'sLYX');
    console.log('Would reach:', ethers.formatEther(sLyxBefore + maxSLYX), 'sLYX total');
    return;
  }
  
  // Transfer staked LYX to sLYX contract to mint
  const vaultInterface = new ethers.Interface(VAULT_ABI);
  const transferCalldata = vaultInterface.encodeFunctionData('transferStake', [
    SLYX_TOKEN,
    lyxNeeded,
    '0x'
  ]);
  
  const upInterface = new ethers.Interface(UP_ABI);
  const upCalldata = upInterface.encodeFunctionData('execute', [
    0,
    STAKINGVERSE_VAULT,
    0,
    transferCalldata
  ]);
  
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  console.log('\n📤 Transferring staked LYX to mint sLYX...');
  try {
    const tx = await keyManager.execute(upCalldata, { gasLimit: 500000 });
    console.log('⏳ Transaction:', tx.hash);
    await tx.wait();
    console.log('✅ Transfer complete!');
    
    const sLyxAfter = await sLyx.balanceOf(UP);
    console.log('\n📊 Final sLYX balance:', ethers.formatEther(sLyxAfter), 'sLYX');
    console.log('Minted:', ethers.formatEther(sLyxAfter - sLyxBefore), 'sLYX');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

mintToReach1000().catch(console.error);
