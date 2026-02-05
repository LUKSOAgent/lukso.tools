const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const COLLECTION_UP = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';
const OWNER_CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const OWNER_KEY = '0xREDACTED_PRIVATE_KEY_1';

const ownerWallet = new ethers.Wallet(OWNER_KEY, provider);

const UP_ABI = [
  'function owner() view returns (address)',
  'function getData(bytes32 dataKey) view returns (bytes)',
  'function setData(bytes32 dataKey, bytes memory dataValue)'
];

const LSP6_ADDRESS_PERMISSIONS_PREFIX = '0x4b80742d0000000082ac0000';
const LSP6_ALL_PERMISSIONS = '0x00000000000000000000000000000000000000000000000000000000007fbf3f';

function createAddressPermissionsDataKey(address) {
  const addr = address.toLowerCase().replace(/^0x/, '');
  return LSP6_ADDRESS_PERMISSIONS_PREFIX + addr;
}

async function setControllerPermissions() {
  console.log('🔐 Setting Controller Permissions\n');
  console.log('Collection UP:', COLLECTION_UP);
  console.log('Controller:', OWNER_CONTROLLER);
  console.log('Signer:', ownerWallet.address);
  console.log('');

  const collectionUP = new ethers.Contract(COLLECTION_UP, UP_ABI, ownerWallet);

  // Check balance
  const balance = await provider.getBalance(ownerWallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'LYX');
  console.log('');

  // Set permissions
  const ownerPermissionsKey = createAddressPermissionsDataKey(OWNER_CONTROLLER);
  console.log('Permissions Key:', ownerPermissionsKey);
  console.log('Permissions Value:', LSP6_ALL_PERMISSIONS);
  console.log('');

  try {
    console.log('Sending transaction...');
    const tx = await collectionUP.setData(ownerPermissionsKey, LSP6_ALL_PERMISSIONS, {
      gasLimit: 500000
    });

    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');

    const receipt = await tx.wait();

    if (receipt.status === 1) {
      console.log('\n✅ Controller permissions set successfully!');
      console.log('Block:', receipt.blockNumber);
      console.log('Gas Used:', receipt.gasUsed.toString());
      console.log('Transaction Hash:', tx.hash);
      return { success: true, txHash: tx.hash };
    } else {
      console.log('\n❌ Transaction failed');
      return { success: false };
    }
  } catch (e) {
    console.error('\n❌ Error:', e.message);
    return { success: false, error: e.message };
  }
}

setControllerPermissions()
  .then(result => {
    if (result.success) {
      console.log('\n✨ Controller permissions configured!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Failed to set permissions');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
