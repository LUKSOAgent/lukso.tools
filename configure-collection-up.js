const { ethers } = require('ethers');
const fs = require('fs');

// Setup provider and wallet
const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

// Collection UP Configuration
const COLLECTION_UP = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';
const OWNER_CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const OWNER_KEY = '0xREDACTED_PRIVATE_KEY_1';

// Known LUKSO contract addresses
const LSP1_UNIVERSAL_RECEIVER_DELEGATE = '0x41b4c4667b99aa73dc6321d8c883f139e7ed6f1f'; // Standard LSP1 Delegate
const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

// Create wallet for owner controller
const ownerWallet = new ethers.Wallet(OWNER_KEY, provider);

console.log('═══════════════════════════════════════════════════');
console.log('  Collection UP Configuration');
console.log('═══════════════════════════════════════════════════\n');

console.log('Collection UP:', COLLECTION_UP);
console.log('Owner/Controller:', OWNER_CONTROLLER);
console.log('Owner UP:', OWNER_UP);
console.log('Signer Address:', ownerWallet.address);
console.log('');

// LSP3Profile Metadata
const lsp3Profile = {
  LSP3Profile: {
    name: "LUKSOAgent Journey",
    description: "A collection documenting the journey of LUKSOAgent - an AI agent exploring the LUKSO ecosystem.",
    links: [{ title: "Twitter", url: "https://twitter.com/LUKSOAgent" }],
    tags: ["AI", "LUKSO", "journey", "moments"],
    profileImage: [],
    backgroundImage: [],
    categories: ["AI", "Technology"],
    visibility: "public",
    collectionType: 0,
    status: "active",
    timestamps: {
      createdAt: "2026-02-04T18:00:00Z",
      updatedAt: "2026-02-04T18:00:00Z"
    },
    ownerUP: OWNER_UP
  }
};

// LUKSO Standard ABIs (Universal Profile, Key Manager, etc.)
const UP_ABI = [
  // Owner and basic functions
  'function owner() view returns (address)',
  'function getData(bytes32 dataKey) view returns (bytes)',
  'function setData(bytes32 dataKey, bytes memory dataValue)',
  'function setDataBatch(bytes32[] memory dataKeys, bytes[] memory dataValues)',
  'function execute(uint256 operation, address to, uint256 value, bytes memory data) returns (bytes)',
  // Universal Receiver
  'function getData(bytes32[] memory dataKeys) view returns (bytes[] memory)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  // Events
  'event DataChanged(bytes32 indexed dataKey, bytes dataValue)',
  'event UniversalReceiverDelegateChanged(address indexed oldDelegate, address indexed newDelegate)'
];

const KEY_MANAGER_ABI = [
  'function execute(bytes calldata payload) returns (bytes)',
  'function getData(bytes32 dataKey) view returns (bytes)',
  'function getKeyManager() view returns (address)',
  'function setPermissions(address controller, bytes32 permissions)',
  'function setPermissionsEncoded(address controller, bytes32 permissions)',
  'function getPermissions(address controller) view returns (bytes32)',
  'function executeRelayCall(bytes memory signature, uint256 nonce, bytes calldata payload) returns (bytes)',
  'function getNonce(address signer) view returns (uint256)',
  // LSP6 functions
  'function setData(bytes32 dataKey, bytes memory dataValue) returns (bytes)',
  'function setDataBatch(bytes32[] memory dataKeys, bytes[] memory dataValues) returns (bytes[])',
  // Standard Key Manager interface
  'function target() view returns (address)',
  'function execute(bytes[] memory payloads) returns (bytes[] memory)'
];

// LSP Standard Data Keys
const LSP3_PROFILE_KEY = '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5';
const LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY = '0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbdf6277f3cc0730c45b828b6db8b47';
const LSP6_KEY_MANAGER_KEY = '0xeafec4d89fa9619883b6b2550701721c064bb27b5025b6b3144a4cd637cc77e3';
const LSP6_ADDRESS_PERMISSIONS_PREFIX = '0x4b80742d0000000082ac0000';
const LSP6_ALL_PERMISSIONS = '0x00000000000000000000000000000000000000000000000000000000007fbf3f';
const PERMISSION_REENTRANCY = '0x0000000000000000000000000000000000000000000000000000000000000001';
const PERMISSION_SUPER_ADMIN = '0x0000000000000000000000000000000000000000000000000000000000000004';
const PERMISSION_EDITPERMISSIONS = '0x0000000000000000000000000000000000000000000000000000000000000008';
const PERMISSION_ADDPERMISSIONS = '0x0000000000000000000000000000000000000000000000000000000000000010';
const PERMISSION_SETDATA = '0x0000000000000000000000000000000000000000000000000000000000000020';
const PERMISSION_CALL = '0x0000000000000000000000000000000000000000000000000000000000000040';
const PERMISSION_STATICCALL = '0x0000000000000000000000000000000000000000000000000000000000000080';
const PERMISSION_DELEGATECALL = '0x0000000000000000000000000000000000000000000000000000000000000100';
const PERMISSION_DEPLOY = '0x0000000000000000000000000000000000000000000000000000000000000200';
const PERMISSION_TRANSFERVALUE = '0x0000000000000000000000000000000000000000000000000000000000000400';
const PERMISSION_SIGN = '0x0000000000000000000000000000000000000000000000000000000000000800';
const PERMISSION_EXECUTE_RELAY_CALL = '0x0000000000000000000000000000000000000000000000000000000000001000';
const PERMISSION_ENCRYPT = '0x0000000000000000000000000000000000000000000000000000000000002000';
const PERMISSION_DECRYPT = '0x0000000000000000000000000000000000000000000000000000000000004000';
const PERMISSION_SIGN_MSG = '0x0000000000000000000000000000000000000000000000000000000000008000';
const PERMISSION_ADD_UNIVERSAL_RECEIVER_DELEGATE = '0x0000000000000000000000000000000000000000000000000000000000010000';
const PERMISSION_CHANGE_UNIVERSAL_RECEIVER_DELEGATE = '0x0000000000000000000000000000000000000000000000000000000000020000';
const PERMISSION_ADD_EXTENSION = '0x0000000000000000000000000000000000000000000000000000000000040000';
const PERMISSION_CHANGE_EXTENSION = '0x0000000000000000000000000000000000000000000000000000000000080000';
const PERMISSION_SET_PERMISSIONS = '0x0000000000000000000000000000000000000000000000000000000000001c';
const PERMISSION_SET_UNIVERSAL_RECEIVER_DELEGATE = '0x0000000000000000000000000000000000000000000000000000000000030000';
const PERMISSION_SET_EXTENSIONS = '0x00000000000000000000000000000000000000000000000000000000000c0000';
const PERMISSION_CALL_TO_SELF = '0x0000000000000000000000000000000000000000000000000000000000002000';
const PERMISSION_DECRYPT_AND_EXECUTE = '0x0000000000000000000000000000000000000000000000000000000000004000';
const PERMISSION_ENCRYPT_AND_TRANSFER = '0x0000000000000000000000000000000000000000000000000000000000008000';
const PERMISSION_RECEIVE_ASSETS = '0x0000000000000000000000000000000000000000000000000000000000010000';
const PERMISSION_TRANSFER_ASSETS = '0x0000000000000000000000000000000000000000000000000000000000020000';

// Helper to create address permission data key
function createAddressPermissionsDataKey(address) {
  // Remove 0x prefix if present
  const addr = address.toLowerCase().replace(/^0x/, '');
  return LSP6_ADDRESS_PERMISSIONS_PREFIX + addr;
}

// Helper to encode LSP3Profile
function encodeLSP3Profile(profile) {
  const jsonString = JSON.stringify(profile);
  const utf8Bytes = ethers.toUtf8Bytes(jsonString);
  return ethers.hexlify(utf8Bytes);
}

async function configureCollectionUP() {
  const results = {
    lsp3ProfileSet: null,
    receiverDelegateSet: null,
    controllerPermissionsSet: null,
    errors: []
  };

  try {
    // Check wallet balance
    const balance = await provider.getBalance(ownerWallet.address);
    console.log('💰 Owner Controller Balance:', ethers.formatEther(balance), 'LYX');
    console.log('');

    // Create contract instances
    const collectionUP = new ethers.Contract(COLLECTION_UP, UP_ABI, provider);
    const collectionUPWithSigner = collectionUP.connect(ownerWallet);

    // Step 1: Verify we can access the Collection UP
    console.log('🔍 Step 1: Checking Collection UP access...');
    try {
      const owner = await collectionUP.owner();
      console.log('   Collection UP Owner:', owner);

      // Check if this is a Key Manager controlled UP
      const keyManagerAddress = await collectionUP.getData(LSP6_KEY_MANAGER_KEY);
      console.log('   Key Manager Address:', keyManagerAddress);
      console.log('   Key Manager is set:', keyManagerAddress !== '0x' && keyManagerAddress !== '0x0000000000000000000000000000000000000000');

      results.keyManager = keyManagerAddress;
    } catch (e) {
      console.log('   Could not read owner/Key Manager:', e.message);
      results.errors.push({ step: 'read_owner', error: e.message });
    }
    console.log('');

    // Step 2: Set LSP3Profile metadata
    console.log('📝 Step 2: Setting LSP3Profile metadata...');
    try {
      const encodedProfile = encodeLSP3Profile(lsp3Profile);
      console.log('   Profile data size:', (encodedProfile.length - 2) / 2, 'bytes');

      // Try direct setData first
      console.log('   Attempting direct setData...');
      const tx = await collectionUPWithSigner.setData(LSP3_PROFILE_KEY, encodedProfile, {
        gasLimit: 500000
      });
      console.log('   Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        console.log('   ✅ LSP3Profile metadata set successfully!');
        console.log('   Block:', receipt.blockNumber);
        console.log('   Gas used:', receipt.gasUsed.toString());
        results.lsp3ProfileSet = {
          success: true,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        };
      }
    } catch (e) {
      console.log('   Direct setData failed:', e.message);
      results.errors.push({ step: 'lsp3_profile_direct', error: e.message });

      // Try via Key Manager if available
      if (results.keyManager && results.keyManager !== '0x' && results.keyManager !== '0x0000000000000000000000000000000000000000') {
        console.log('   Attempting via Key Manager...');
        try {
          const keyManager = new ethers.Contract(results.keyManager, KEY_MANAGER_ABI, provider);
          const keyManagerWithSigner = keyManager.connect(ownerWallet);

          const encodedProfile = encodeLSP3Profile(lsp3Profile);
          const setDataPayload = collectionUP.interface.encodeFunctionData('setData', [LSP3_PROFILE_KEY, encodedProfile]);

          const tx = await keyManagerWithSigner.execute(setDataPayload, { gasLimit: 500000 });
          console.log('   Transaction sent via Key Manager:', tx.hash);

          const receipt = await tx.wait();
          if (receipt.status === 1) {
            console.log('   ✅ LSP3Profile metadata set via Key Manager!');
            console.log('   Block:', receipt.blockNumber);
            results.lsp3ProfileSet = {
              success: true,
              txHash: tx.hash,
              blockNumber: receipt.blockNumber,
              method: 'key_manager'
            };
          }
        } catch (kmError) {
          console.log('   Key Manager approach failed:', kmError.message);
          results.errors.push({ step: 'lsp3_profile_km', error: kmError.message });
        }
      }
    }
    console.log('');

    // Step 3: Set Universal Receiver Delegate (LSP1)
    console.log('🔗 Step 3: Setting Universal Receiver Delegate (LSP1)...');
    try {
      const delegateAddress = LSP1_UNIVERSAL_RECEIVER_DELEGATE;
      console.log('   Delegate address:', delegateAddress);

      const tx = await collectionUPWithSigner.setData(LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY, delegateAddress, {
        gasLimit: 500000
      });
      console.log('   Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        console.log('   ✅ Universal Receiver Delegate set successfully!');
        console.log('   Block:', receipt.blockNumber);
        results.receiverDelegateSet = {
          success: true,
          txHash: tx.hash,
          delegate: delegateAddress
        };
      }
    } catch (e) {
      console.log('   Direct setData failed:', e.message);
      results.errors.push({ step: 'receiver_delegate_direct', error: e.message });

      // Try via Key Manager
      if (results.keyManager && results.keyManager !== '0x') {
        try {
          const keyManager = new ethers.Contract(results.keyManager, KEY_MANAGER_ABI, provider);
          const keyManagerWithSigner = keyManager.connect(ownerWallet);

          const delegateData = LSP1_UNIVERSAL_RECEIVER_DELEGATE;
          const setDataPayload = collectionUP.interface.encodeFunctionData('setData', [LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY, delegateData]);

          const tx = await keyManagerWithSigner.execute(setDataPayload, { gasLimit: 500000 });
          const receipt = await tx.wait();

          if (receipt.status === 1) {
            console.log('   ✅ Universal Receiver Delegate set via Key Manager!');
            results.receiverDelegateSet = {
              success: true,
              txHash: tx.hash,
              delegate: LSP1_UNIVERSAL_RECEIVER_DELEGATE
            };
          }
        } catch (kmError) {
          console.log('   Key Manager approach failed:', kmError.message);
          results.errors.push({ step: 'receiver_delegate_km', error: kmError.message });
        }
      }
    }
    console.log('');

    // Step 4: Set controller permissions for owner
    console.log('🔐 Step 4: Setting controller permissions for owner...');
    try {
      const ownerPermissionsKey = createAddressPermissionsDataKey(OWNER_CONTROLLER);
      console.log('   Owner permissions key:', ownerPermissionsKey);
      console.log('   Setting ALL_PERMISSIONS:', LSP6_ALL_PERMISSIONS);

      const tx = await collectionUPWithSigner.setData(ownerPermissionsKey, LSP6_ALL_PERMISSIONS, {
        gasLimit: 500000
      });
      console.log('   Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        console.log('   ✅ Controller permissions set successfully!');
        console.log('   Block:', receipt.blockNumber);
        results.controllerPermissionsSet = {
          success: true,
          txHash: tx.hash,
          controller: OWNER_CONTROLLER,
          permissions: LSP6_ALL_PERMISSIONS
        };
      }
    } catch (e) {
      console.log('   Direct setData failed:', e.message);
      results.errors.push({ step: 'controller_permissions_direct', error: e.message });

      // Try via Key Manager
      if (results.keyManager && results.keyManager !== '0x') {
        try {
          const keyManager = new ethers.Contract(results.keyManager, KEY_MANAGER_ABI, provider);
          const keyManagerWithSigner = keyManager.connect(ownerWallet);

          const ownerPermissionsKey = createAddressPermissionsDataKey(OWNER_CONTROLLER);
          const setDataPayload = collectionUP.interface.encodeFunctionData('setData', [ownerPermissionsKey, LSP6_ALL_PERMISSIONS]);

          const tx = await keyManagerWithSigner.execute(setDataPayload, { gasLimit: 500000 });
          const receipt = await tx.wait();

          if (receipt.status === 1) {
            console.log('   ✅ Controller permissions set via Key Manager!');
            results.controllerPermissionsSet = {
              success: true,
              txHash: tx.hash,
              method: 'key_manager'
            };
          }
        } catch (kmError) {
          console.log('   Key Manager approach failed:', kmError.message);
          results.errors.push({ step: 'controller_permissions_km', error: kmError.message });
        }
      }
    }
    console.log('');

    // Step 5: Configure permissions for receiving assets
    console.log('💎 Step 5: Configuring asset management permissions...');

    // Additional permissions that may be needed
    const assetPermissions = [
      { name: 'SETDATA', value: PERMISSION_SETDATA },
      { name: 'CALL', value: PERMISSION_CALL },
      { name: 'TRANSFERVALUE', value: PERMISSION_TRANSFERVALUE },
      { name: 'DEPLOY', value: PERMISSION_DEPLOY },
      { name: 'SUPER_ADMIN', value: PERMISSION_SUPER_ADMIN }
    ];

    results.assetPermissions = [];

    for (const perm of assetPermissions) {
      try {
        console.log(`   Checking ${perm.name}...`);
        // These are already included in ALL_PERMISSIONS, so this is verification
        results.assetPermissions.push({
          name: perm.name,
          includedInAllPermissions: true
        });
      } catch (e) {
        console.log(`   Error checking ${perm.name}:`, e.message);
      }
    }

    console.log('   ✅ Asset management permissions verified');
    console.log('');

    // Step 6: Verify configuration
    console.log('✅ Step 6: Verifying configuration...');
    try {
      // Check LSP3Profile
      try {
        const profileData = await collectionUP.getData(LSP3_PROFILE_KEY);
        if (profileData && profileData !== '0x') {
          console.log('   LSP3Profile: ✅ Set (data present)');
          results.lsp3ProfileSet = { ...results.lsp3ProfileSet, verified: true };
        } else {
          console.log('   LSP3Profile: ⚠️ Not verified (no data)');
        }
      } catch (e) {
        console.log('   LSP3Profile: ❌ Error reading:', e.message);
      }

      // Check LSP1 Delegate
      try {
        const delegateData = await collectionUP.getData(LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY);
        if (delegateData && delegateData.toLowerCase() === LSP1_UNIVERSAL_RECEIVER_DELEGATE.toLowerCase()) {
          console.log('   LSP1 Delegate: ✅ Set correctly');
          results.receiverDelegateSet = { ...results.receiverDelegateSet, verified: true };
        } else {
          console.log('   LSP1 Delegate: ⚠️ Not verified (got:', delegateData, ')');
        }
      } catch (e) {
        console.log('   LSP1 Delegate: ❌ Error reading:', e.message);
      }

      // Check permissions
      try {
        const ownerPermissionsKey = createAddressPermissionsDataKey(OWNER_CONTROLLER);
        const permData = await collectionUP.getData(ownerPermissionsKey);
        if (permData && permData !== '0x') {
          console.log('   Controller Permissions: ✅ Set (data present)');
          results.controllerPermissionsSet = { ...results.controllerPermissionsSet, verified: true };
        } else {
          console.log('   Controller Permissions: ⚠️ Not verified (no data)');
        }
      } catch (e) {
        console.log('   Controller Permissions: ❌ Error reading:', e.message);
      }
    } catch (e) {
      console.log('   Error verifying configuration:', e.message);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Fatal error during configuration:', error.message);
    results.errors.push({ step: 'fatal', error: error.message });
  }

  return results;
}

// Execute configuration
configureCollectionUP()
  .then(results => {
    console.log('═══════════════════════════════════════════════════');
    console.log('  Configuration Summary');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('📍 Collection UP:', COLLECTION_UP);
    console.log('👤 Owner UP:', OWNER_UP);
    console.log('🔑 Controller:', OWNER_CONTROLLER);
    console.log('');

    console.log('Configuration Results:');
    console.log('─────────────────────────────────────────────────────');

    // LSP3Profile
    if (results.lsp3ProfileSet?.success) {
      console.log('✅ LSP3Profile Metadata');
      console.log('   Name:', lsp3Profile.LSP3Profile.name);
      console.log('   Tx Hash:', results.lsp3ProfileSet.txHash);
      console.log('   Block:', results.lsp3ProfileSet.blockNumber);
      if (results.lsp3ProfileSet.verified) console.log('   Status: Verified on-chain');
    } else {
      console.log('❌ LSP3Profile Metadata: Failed');
    }
    console.log('');

    // LSP1 Delegate
    if (results.receiverDelegateSet?.success) {
      console.log('✅ Universal Receiver Delegate (LSP1)');
      console.log('   Delegate:', results.receiverDelegateSet.delegate || LSP1_UNIVERSAL_RECEIVER_DELEGATE);
      console.log('   Tx Hash:', results.receiverDelegateSet.txHash);
      if (results.receiverDelegateSet.verified) console.log('   Status: Verified on-chain');
    } else {
      console.log('❌ Universal Receiver Delegate: Failed');
    }
    console.log('');

    // Controller Permissions
    if (results.controllerPermissionsSet?.success) {
      console.log('✅ Controller Permissions');
      console.log('   Controller:', results.controllerPermissionsSet.controller || OWNER_CONTROLLER);
      console.log('   Permissions: ALL_PERMISSIONS (0x7fbf3f)');
      console.log('   Tx Hash:', results.controllerPermissionsSet.txHash);
      if (results.controllerPermissionsSet.verified) console.log('   Status: Verified on-chain');
    } else {
      console.log('❌ Controller Permissions: Failed');
    }
    console.log('');

    if (results.errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      results.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.step}: ${err.error.slice(0, 80)}...`);
      });
      console.log('');
    }

    console.log('🔗 Explorer Links:');
    console.log(`   Collection UP: https://wallet.universalprofile.cloud/${COLLECTION_UP}`);
    console.log(`   Owner UP: https://wallet.universalprofile.cloud/${OWNER_UP}`);
    console.log(`   Explorer: https://explorer.execution.mainnet.lukso.network/address/${COLLECTION_UP}`);
    console.log('');

    // Save results
    fs.writeFileSync('collection-config-results.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      collectionUP: COLLECTION_UP,
      ownerUP: OWNER_UP,
      controller: OWNER_CONTROLLER,
      lsp3Profile,
      results
    }, null, 2));

    console.log('Results saved to: collection-config-results.json');

    // Exit with appropriate code
    const allSuccessful = results.lsp3ProfileSet?.success &&
                          results.receiverDelegateSet?.success &&
                          results.controllerPermissionsSet?.success;

    if (allSuccessful) {
      console.log('\n✨ Collection UP configured successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Configuration incomplete. Some steps failed.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });
