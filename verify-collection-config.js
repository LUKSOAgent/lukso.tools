const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const COLLECTION_UP = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';
const OWNER_CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const LSP1_UNIVERSAL_RECEIVER_DELEGATE = '0x41b4c4667b99aa73dc6321d8c883f139e7ed6f1f';

const UP_ABI = [
  'function owner() view returns (address)',
  'function getData(bytes32 dataKey) view returns (bytes)',
  'function setData(bytes32 dataKey, bytes memory dataValue)',
  'function setDataBatch(bytes32[] memory dataKeys, bytes[] memory dataValues)'
];

const LSP3_PROFILE_KEY = '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5';
const LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY = '0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbdf6277f3cc0730c45b828b6db8b47';
const LSP6_ADDRESS_PERMISSIONS_PREFIX = '0x4b80742d0000000082ac0000';

function createAddressPermissionsDataKey(address) {
  const addr = address.toLowerCase().replace(/^0x/, '');
  return LSP6_ADDRESS_PERMISSIONS_PREFIX + addr;
}

async function verifyConfiguration() {
  console.log('🔍 Verifying Collection UP Configuration\n');
  console.log('Collection UP:', COLLECTION_UP);
  console.log('');

  const collectionUP = new ethers.Contract(COLLECTION_UP, UP_ABI, provider);

  // Check transactions
  const txs = [
    '0x88105bb07b7f25e9dceab2034b5f4049cfc9642761d6537b353afae1e46e9d7a',
    '0x953060ca67cabc05a6c1233a5b8d159ffe30dad76cba873557feb4d10207f7a0'
  ];

  console.log('Checking Transactions:');
  console.log('─────────────────────────────────────────────────────');
  
  for (const txHash of txs) {
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        console.log(`\n✅ ${txHash}`);
        console.log('   Status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
        console.log('   Block:', receipt.blockNumber);
        console.log('   Gas Used:', receipt.gasUsed.toString());
      } else {
        console.log(`\n⏳ ${txHash}`);
        console.log('   Status: PENDING (not yet mined)');
      }
    } catch (e) {
      console.log(`\n❌ ${txHash}`);
      console.log('   Error:', e.message);
    }
  }

  console.log('\n\nChecking On-Chain Data:');
  console.log('─────────────────────────────────────────────────────');

  // Check LSP3Profile
  try {
    const profileData = await collectionUP.getData(LSP3_PROFILE_KEY);
    if (profileData && profileData !== '0x') {
      console.log('\n✅ LSP3Profile');
      console.log('   Data Key:', LSP3_PROFILE_KEY);
      console.log('   Data Present: Yes');
      try {
        const decoded = JSON.parse(ethers.toUtf8String(profileData));
        console.log('   Profile Name:', decoded.LSP3Profile?.name || 'N/A');
      } catch (e) {
        console.log('   Raw Data:', profileData.slice(0, 100) + '...');
      }
    } else {
      console.log('\n❌ LSP3Profile: Not set');
    }
  } catch (e) {
    console.log('\n❌ LSP3Profile: Error reading -', e.message);
  }

  // Check LSP1 Delegate
  try {
    const delegateData = await collectionUP.getData(LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY);
    if (delegateData && delegateData !== '0x') {
      const formattedDelegate = '0x' + delegateData.slice(-40);
      console.log('\n✅ Universal Receiver Delegate (LSP1)');
      console.log('   Data Key:', LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY);
      console.log('   Delegate:', formattedDelegate);
      console.log('   Matches Standard:', formattedDelegate.toLowerCase() === LSP1_UNIVERSAL_RECEIVER_DELEGATE.toLowerCase() ? 'Yes' : 'No');
    } else {
      console.log('\n❌ LSP1 Delegate: Not set');
    }
  } catch (e) {
    console.log('\n❌ LSP1 Delegate: Error reading -', e.message);
  }

  // Check Controller Permissions
  try {
    const ownerPermissionsKey = createAddressPermissionsDataKey(OWNER_CONTROLLER);
    const permData = await collectionUP.getData(ownerPermissionsKey);
    if (permData && permData !== '0x') {
      console.log('\n✅ Controller Permissions');
      console.log('   Controller:', OWNER_CONTROLLER);
      console.log('   Permissions:', permData);
      console.log('   Has ALL_PERMISSIONS:', permData.toLowerCase().includes('7fbf3f') ? 'Yes' : 'Check required');
    } else {
      console.log('\n⚠️ Controller Permissions: Not found (may need to be set)');
    }
  } catch (e) {
    console.log('\n❌ Controller Permissions: Error reading -', e.message);
  }

  // Check Owner
  try {
    const owner = await collectionUP.owner();
    console.log('\nℹ️ Collection Owner:', owner);
    console.log('   Owner is Controller:', owner.toLowerCase() === OWNER_CONTROLLER.toLowerCase() ? 'Yes' : 'No');
  } catch (e) {
    console.log('\n❌ Owner: Error reading -', e.message);
  }

  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('Explorer Links:');
  console.log(`  Wallet: https://wallet.universalprofile.cloud/${COLLECTION_UP}`);
  console.log(`  Explorer: https://explorer.execution.mainnet.lukso.network/address/${COLLECTION_UP}`);
  console.log('═══════════════════════════════════════════════════\n');
}

verifyConfiguration().catch(console.error);
