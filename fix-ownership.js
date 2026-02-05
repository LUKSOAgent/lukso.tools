const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.mainnet.lukso.network';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';

const COLLECTION_UP = '0x540F155Be3fCC42cBcd0b0A64f6ea14DAdE142d0';
const KEY_MANAGER = '0xb1d8FBf01d7C1EB6cc97B8E7E8DE693851F93F02';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const UP_ABI = [
  "function owner() view returns (address)",
  "function transferOwnership(address newOwner)",
  "function acceptOwnership()",
  "function pendingOwner() view returns (address)"
];

const KM_ABI = [
  "function target() view returns (address)",
  "function execute(bytes calldata payload) external returns (bytes memory)"
];

async function fixOwnership() {
  console.log('Fixing Collection UP ownership...\n');
  console.log('Collection UP:', COLLECTION_UP);
  console.log('KeyManager:', KEY_MANAGER);
  console.log('');

  const up = new ethers.Contract(COLLECTION_UP, UP_ABI, wallet);
  const km = new ethers.Contract(KEY_MANAGER, KM_ABI, wallet);

  // Check current owner
  const currentOwner = await up.owner();
  console.log('Current Owner:', currentOwner);
  console.log('Is KeyManager:', currentOwner.toLowerCase() === KEY_MANAGER.toLowerCase());
  console.log('');

  // Check pending owner
  try {
    const pendingOwner = await up.pendingOwner();
    console.log('Pending Owner:', pendingOwner);
    console.log('');
  } catch (e) {
    console.log('No pending owner (not in transfer process)');
  }

  if (currentOwner.toLowerCase() === KEY_MANAGER.toLowerCase()) {
    console.log('✅ UP is already owned by KeyManager. Nothing to fix.');
    return;
  }

  // If we're the current owner, initiate transfer
  if (currentOwner.toLowerCase() === wallet.address.toLowerCase()) {
    console.log('Initiating ownership transfer to KeyManager...');
    const tx = await up.transferOwnership(KEY_MANAGER, { gasLimit: 300000 });
    await tx.wait();
    console.log('✅ Transfer initiated. Tx:', tx.hash);
    console.log('');
  }

  // Now we need to accept ownership from the KeyManager side
  // The KeyManager needs to call acceptOwnership() on the UP
  console.log('Accepting ownership via KeyManager...');
  
  // Encode the acceptOwnership call
  const acceptOwnershipData = up.interface.encodeFunctionData('acceptOwnership');
  console.log('Encoded payload:', acceptOwnershipData);
  
  // Execute via KeyManager
  const tx2 = await km.execute(acceptOwnershipData, { gasLimit: 500000 });
  console.log('Transaction sent:', tx2.hash);
  
  const receipt = await tx2.wait();
  console.log('✅ Ownership accepted! Block:', receipt.blockNumber);
  console.log('');

  // Verify
  const newOwner = await up.owner();
  console.log('New Owner:', newOwner);
  console.log('Is KeyManager:', newOwner.toLowerCase() === KEY_MANAGER.toLowerCase());
  
  if (newOwner.toLowerCase() === KEY_MANAGER.toLowerCase()) {
    console.log('\n🎉 SUCCESS! UP is now properly owned by KeyManager');
  } else {
    console.log('\n❌ Failed: UP is not owned by KeyManager');
  }
}

fixOwnership().catch(console.error);
