const { ethers } = require('ethers');

// My controller (with funds)
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

// Target controller (needs funding)
const TARGET_CONTROLLER = '0xf4dF36124d5D1bBEc1EE55CA20F70905E0f59e2b';

// LUKSO Mainnet
const RPC_URL = 'https://rpc.mainnet.lukso.network';
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

async function fundController() {
  console.log('🔑 My Controller:', MY_CONTROLLER);
  console.log('🎯 Target Controller:', TARGET_CONTROLLER);
  
  const myBalance = await provider.getBalance(MY_CONTROLLER);
  console.log('💰 My Balance:', ethers.formatEther(myBalance), 'LYX');
  
  const targetBalance = await provider.getBalance(TARGET_CONTROLLER);
  console.log('💰 Target Balance:', ethers.formatEther(targetBalance), 'LYX');
  
  // Send 0.5 LYX for deployment gas
  const amount = ethers.parseEther('0.5');
  console.log('📤 Sending 0.5 LYX to target...');
  
  const tx = await wallet.sendTransaction({
    to: TARGET_CONTROLLER,
    value: amount
  });
  
  console.log('⏳ Transaction sent:', tx.hash);
  const receipt = await tx.wait();
  console.log('✅ Confirmed in block:', receipt.blockNumber);
  
  const newTargetBalance = await provider.getBalance(TARGET_CONTROLLER);
  console.log('💰 New Target Balance:', ethers.formatEther(newTargetBalance), 'LYX');
}

fundController().catch(console.error);
