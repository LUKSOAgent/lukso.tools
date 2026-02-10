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
  "function getExchangeRate() external view returns (uint256)",
  "function burn(address from, uint256 amount, bytes memory data) external"
];

const VAULT_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transferStake(address to, uint256 amount, bytes calldata data) external"
];

async function unstake() {
  console.log('🔓 Unstaking 10 LYX worth of sLYX...\n');
  
  // Check current balances
  const sLyx = new ethers.Contract(SLYX_TOKEN, SLYX_ABI, provider);
  const vault = new ethers.Contract(STAKINGVERSE_VAULT, VAULT_ABI, provider);
  
  const sLyxBalance = await sLyx.balanceOf(UP);
  console.log('UP sLYX balance:', ethers.formatEther(sLyxBalance), 'sLYX');
  
  const exchangeRate = await sLyx.getExchangeRate();
  console.log('sLYX/LYX exchange rate:', ethers.formatEther(exchangeRate));
  
  // Calculate how much sLYX to burn for ~10 LYX
  const targetLyx = ethers.parseEther('10');
  const sLyxToBurn = await sLyx.getSLYXTokenValue(targetLyx);
  console.log('sLYX to burn for 10 LYX:', ethers.formatEther(sLyxToBurn), 'sLYX');
  
  if (sLyxBalance < sLyxToBurn) {
    console.log('❌ Insufficient sLYX balance!');
    return;
  }
  
  // Check staked balance before
  const stakedBefore = await vault.balanceOf(UP);
  console.log('\nStaked LYX before:', ethers.formatEther(stakedBefore), 'LYX');
  
  // Step 1: Burn sLYX from UP
  // This will convert sLYX back to staked LYX in the vault
  const sLyxInterface = new ethers.Interface(SLYX_ABI);
  const burnCalldata = sLyxInterface.encodeFunctionData('burn', [
    UP, // from (UP's sLYX)
    sLyxToBurn, // amount
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
  
  console.log('\n📤 Step 1: Burning sLYX...');
  try {
    const tx1 = await keyManager.execute(upCalldata, { gasLimit: 500000 });
    console.log('⏳ Burn tx:', tx1.hash);
    await tx1.wait();
    console.log('✅ sLYX burned!');
    
    // Check staked balance after burn
    const stakedAfterBurn = await vault.balanceOf(UP);
    console.log('Staked LYX after burn:', ethers.formatEther(stakedAfterBurn), 'LYX');
    
    // Step 2: Transfer staked LYX from UP to controller
    const stakedToTransfer = stakedAfterBurn - stakedBefore;
    console.log('\n📤 Step 2: Transferring', ethers.formatEther(stakedToTransfer), 'staked LYX to controller...');
    
    const transferCalldata = sLyxInterface.encodeFunctionData('transferStake', [
      CONTROLLER,
      stakedToTransfer,
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
    console.log('✅ Staked LYX transferred!');
    
    // Step 3: Controller withdraws staked LYX to get native LYX
    console.log('\n📤 Step 3: Controller withdrawing to native LYX...');
    
    // Controller needs to call vault.withdraw(amount, beneficiary)
    // But controller doesn't have direct access to the vault stake...
    // Actually, we need to think about this differently
    
    console.log('\n⚠️ Note: The staked LYX was transferred to controller.');
    console.log('To get native LYX, controller needs to:');
    console.log('1. Call vault.withdraw(amount, controller) to request withdrawal');
    console.log('2. Wait for oracle to process');
    console.log('3. Call vault.claim(amount, controller) to get native LYX');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

unstake().catch(console.error);
