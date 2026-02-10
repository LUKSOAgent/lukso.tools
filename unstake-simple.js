const { ethers } = require('ethers');

const CONTROLLER_PK = '0xREDACTED_PRIVATE_KEY_1';
const UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const SLYX_TOKEN = '0x8a3982f0a7d154d11a5f43eec7f50e52ebbc8f7d';
const STAKINGVERSE_VAULT = '0x9F49a95b0c3c9e2A6c77a16C177928294c0F6F04';

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(CONTROLLER_PK, provider);

const KEY_MANAGER_ABI = [
  "function execute(bytes calldata payload) external payable returns (bytes memory)"
];

const UP_ABI = [
  "function execute(uint256 operation, address to, uint256 value, bytes calldata data) external payable returns (bytes memory)"
];

const SLYX_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function getNativeTokenValue(uint256 sLyxAmount) external view returns (uint256)",
  "function getExchangeRate() external view returns (uint256)"
];

const VAULT_ABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

async function unstake() {
  console.log('🔓 Unstaking ~10 LYX worth of sLYX...\n');
  
  // Check current balances
  const sLyx = new ethers.Contract(SLYX_TOKEN, SLYX_ABI, provider);
  const vault = new ethers.Contract(STAKINGVERSE_VAULT, VAULT_ABI, provider);
  
  const sLyxBalance = await sLyx.balanceOf(UP);
  console.log('UP sLYX balance:', ethers.formatEther(sLyxBalance), 'sLYX');
  
  const exchangeRate = await sLyx.getExchangeRate();
  console.log('sLYX/LYX exchange rate:', ethers.formatEther(exchangeRate));
  
  // Calculate sLYX needed for ~10 LYX
  // If 1 sLYX = X LYX, then for 10 LYX we need 10/X sLYX
  const targetLyx = ethers.parseEther('10');
  const sLyxToBurn = (targetLyx * ethers.parseEther('1')) / exchangeRate;
  console.log('sLYX to burn for ~10 LYX:', ethers.formatEther(sLyxToBurn), 'sLYX');
  
  // Check staked balance before
  const stakedBefore = await vault.balanceOf(UP);
  console.log('\nStaked LYX before:', ethers.formatEther(stakedBefore), 'LYX');
  
  // Burn sLYX from UP
  // When sLYX is burned, the vault stake is transferred back to the burner
  const sLyxInterface = new ethers.Interface([
    "function burn(address from, uint256 amount, bytes memory data) external"
  ]);
  
  const burnCalldata = sLyxInterface.encodeFunctionData('burn', [
    UP, // from (UP's sLYX)
    sLyxToBurn, // burn calculated amount
    '0x' // data
  ]);
  
  const upInterface = new ethers.Interface(UP_ABI);
  const upCalldata = upInterface.encodeFunctionData('execute', [
    0, // call
    SLYX_TOKEN,
    0, // no value
    burnCalldata
  ]);
  
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  console.log('\n📤 Burning sLYX...');
  try {
    const tx = await keyManager.execute(upCalldata, { gasLimit: 500000 });
    console.log('⏳ Burn tx:', tx.hash);
    await tx.wait();
    console.log('✅ sLYX burned!');
    
    // Check balances after
    const sLyxAfter = await sLyx.balanceOf(UP);
    const stakedAfter = await vault.balanceOf(UP);
    
    console.log('\n📊 After burn:');
    console.log('sLYX balance:', ethers.formatEther(sLyxAfter), 'sLYX');
    console.log('Staked LYX:', ethers.formatEther(stakedAfter), 'LYX');
    
    const stakedGained = stakedAfter - stakedBefore;
    console.log('\nStaked LYX gained:', ethers.formatEther(stakedGained), 'LYX');
    
    // Now we need to withdraw this staked LYX to controller
    // But first we need to transfer stake from UP to controller
    console.log('\n📤 Transferring staked LYX to controller...');
    
    const vaultInterface = new ethers.Interface([
      "function transferStake(address to, uint256 amount, bytes calldata data) external"
    ]);
    
    const transferCalldata = vaultInterface.encodeFunctionData('transferStake', [
      CONTROLLER,
      stakedGained,
      '0x'
    ]);
    
    const upCalldata2 = upInterface.encodeFunctionData('execute', [
      0,
      STAKINGVERSE_VAULT,
      0,
      transferCalldata
    ]);
    
    const tx2 = await keyManager.execute(upCalldata2, { gasLimit: 500000 });
    console.log('⏳ Transfer tx:', tx2.hash);
    await tx2.wait();
    console.log('✅ Staked LYX transferred to controller!');
    
    // Check controller's vault stake
    const controllerStaked = await vault.balanceOf(CONTROLLER);
    console.log('\nController staked LYX:', ethers.formatEther(controllerStaked), 'LYX');
    
    console.log('\n⚠️ To get native LYX:');
    console.log('Controller now has staked LYX in the vault.');
    console.log('Call vault.withdraw(amount, controller) then vault.claim() to get native LYX');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.data) console.error('Data:', err.data);
  }
}

unstake().catch(console.error);
