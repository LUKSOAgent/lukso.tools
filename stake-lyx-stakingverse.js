const { ethers } = require('ethers');

// My credentials
const CONTROLLER_PK = '0xREDACTED_PRIVATE_KEY_1';
const UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

// Stakingverse Vault
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
  "function deposit(address beneficiary) external payable",
  "function balanceOf(address account) external view returns (uint256)",
  "function totalAssets() external view returns (uint256)"
];

const SLYX_ABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

async function stakeLYX() {
  const amount = ethers.parseEther('10'); // 10 LYX
  
  console.log('🚀 Staking 10 LYX at Stakingverse...\n');
  console.log('UP:', UP);
  console.log('Vault:', STAKINGVERSE_VAULT);
  console.log('Amount:', ethers.formatEther(amount), 'LYX\n');
  
  // Check current balances
  const controllerBalance = await provider.getBalance(wallet.address);
  console.log('Controller balance:', ethers.formatEther(controllerBalance), 'LYX');
  
  if (controllerBalance < amount) {
    console.log('❌ Insufficient balance!');
    return;
  }
  
  // Encode vault.deposit(UP) call
  const vaultInterface = new ethers.Interface(VAULT_ABI);
  const depositCalldata = vaultInterface.encodeFunctionData('deposit', [UP]);
  console.log('Deposit calldata:', depositCalldata);
  
  // Encode UP.execute(0, vault, 10 LYX, depositCalldata)
  const upInterface = new ethers.Interface(UP_ABI);
  const upCalldata = upInterface.encodeFunctionData('execute', [
    0, // operation: call
    STAKINGVERSE_VAULT,
    amount,
    depositCalldata
  ]);
  console.log('UP calldata:', upCalldata);
  
  // Execute via KeyManager
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  console.log('\n📤 Sending transaction...');
  try {
    const tx = await keyManager.execute(upCalldata, { 
      value: amount,
      gasLimit: 500000 
    });
    
    console.log('⏳ Transaction:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Confirmed in block:', receipt.blockNumber);
    
    // Check new balances
    console.log('\n📊 Checking balances...');
    
    const vault = new ethers.Contract(STAKINGVERSE_VAULT, VAULT_ABI, provider);
    const stakedBalance = await vault.balanceOf(UP);
    console.log('Staked balance:', ethers.formatEther(stakedBalance), 'LYX');
    
    const sLyx = new ethers.Contract(SLYX_TOKEN, SLYX_ABI, provider);
    const sLyxBalance = await sLyx.balanceOf(UP);
    console.log('sLYX balance:', ethers.formatEther(sLyxBalance), 'sLYX');
    
    console.log('\n🎉 Successfully staked 10 LYX!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.data) console.error('Data:', err.data);
  }
}

stakeLYX().catch(console.error);
