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
  "function deposit(address beneficiary) external payable",
  "function balanceOf(address account) external view returns (uint256)"
];

const SLYX_ABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

async function mintSLYX() {
  const amount = ethers.parseEther('10'); // 10 LYX
  
  console.log('🪙 Minting 10 sLYX...\n');
  console.log('UP:', UP);
  console.log('Vault:', STAKINGVERSE_VAULT);
  console.log('Amount:', ethers.formatEther(amount), 'LYX\n');
  
  // Check current balances
  const upBalance = await provider.getBalance(UP);
  console.log('UP balance:', ethers.formatEther(upBalance), 'LYX');
  
  const sLyx = new ethers.Contract(SLYX_TOKEN, SLYX_ABI, provider);
  const sLyxBefore = await sLyx.balanceOf(UP);
  console.log('sLYX balance before:', ethers.formatEther(sLyxBefore), 'sLYX');
  
  if (upBalance < amount) {
    console.log('❌ UP has insufficient balance!');
    return;
  }
  
  // Encode vault.deposit(UP) call - this will mint sLYX
  const vaultInterface = new ethers.Interface(VAULT_ABI);
  const depositCalldata = vaultInterface.encodeFunctionData('deposit', [UP]);
  
  // Encode UP.execute(0, vault, 10 LYX, depositCalldata)
  const upInterface = new ethers.Interface(UP_ABI);
  const upCalldata = upInterface.encodeFunctionData('execute', [
    0, // operation: call
    STAKINGVERSE_VAULT,
    amount,
    depositCalldata
  ]);
  
  // Execute via KeyManager
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  console.log('\n📤 Staking 10 LYX to mint sLYX...');
  try {
    const tx = await keyManager.execute(upCalldata, { 
      gasLimit: 500000 
    });
    
    console.log('⏳ Transaction:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Confirmed in block:', receipt.blockNumber);
    
    // Check new sLYX balance
    const sLyxAfter = await sLyx.balanceOf(UP);
    console.log('\n📊 sLYX balance after:', ethers.formatEther(sLyxAfter), 'sLYX');
    console.log('Minted:', ethers.formatEther(sLyxAfter - sLyxBefore), 'sLYX');
    
    console.log('\n🎉 Successfully minted sLYX!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.data) console.error('Data:', err.data);
  }
}

mintSLYX().catch(console.error);
