const { ethers } = require('ethers');
const fs = require('fs');

// Import ABIs from LUKSO smart contracts
const LSP23LinkedContractsFactoryABI = require('@lukso/lsp-smart-contracts/artifacts/LSP23LinkedContractsFactory.json');
const UniversalProfileABI = require('@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json');
const LSP6KeyManagerABI = require('@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json');
const LSP0ERC725AccountABI = require('@lukso/lsp-smart-contracts/artifacts/LSP0ERC725Account.json');

// Setup
const RPC_URL = 'https://rpc.mainnet.lukso.network';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const CONTROLLER_ADDRESS = '0xE093A714960da1bF297522617BfC08132b62B86a';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// LUKSO Mainnet addresses
const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
const LSP1_UNIVERSAL_RECEIVER_DELEGATE = '0x41b4c4667b99aa73dc6321d8c883f139e7ed6f1f';

// Data keys
const LSP3_PROFILE_KEY = '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5';
const LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY = '0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbdf6277f3cc0730c45b828b6db8b47';
const LSP6_ADDRESS_PERMISSIONS_PREFIX = '0x4b80742d0000000082ac0000';
const ALL_PERMISSIONS = '0x00000000000000000000000000000000000000000000000000000000007fbf3f';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  PROPER Collection UP Deployment');
console.log('  Architecture: UP owned by KeyManager (not EOA)');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Deployer:', wallet.address);
console.log('Controller:', CONTROLLER_ADDRESS);
console.log('');

// LSP3 Profile metadata for the collection
const lsp3Profile = {
  LSP3Profile: {
    name: "Forever Moments Collection",
    description: "A collection of eternal moments captured on the LUKSO blockchain. Created by LUKSOAgent to preserve memories forever.",
    links: [
      { title: "X / Twitter", url: "https://x.com/LUKSOAgent" },
      { title: "AGENTPO Token", url: "https://explorer.lukso.network/address/0x47568BC4DC7Fee1bB67f741BA927e2904B61f016" }
    ],
    tags: ["AI", "LUKSO", "moments", "collection", "NFT", "forever"],
    profileImage: [],
    backgroundImage: []
  }
};

async function deployProperCollectionUP() {
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Deployer Balance:', ethers.formatEther(balance), 'LYX\n');

  if (balance < ethers.parseEther('0.3')) {
    console.error('❌ Insufficient balance. Need at least 0.3 LYX.');
    process.exit(1);
  }

  // Create factory contract instance
  const factory = new ethers.Contract(LSP23_FACTORY, LSP23LinkedContractsFactoryABI.abi, wallet);

  console.log('Step 1: Preparing deployment parameters...');

  // Generate random salt
  const salt = ethers.randomBytes(32);

  // Get bytecode from artifacts
  const upBytecode = UniversalProfileABI.bytecode;
  const kmBytecode = LSP6KeyManagerABI.bytecode;

  // Primary contract: UniversalProfile
  // Constructor: initialOwner (we'll use deployer initially, then transfer to KM)
  const upConstructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(['address'], [wallet.address]);
  const primaryContractDeployment = {
    salt: salt,
    fundingAmount: 0,
    creationBytecode: upBytecode + upConstructorArgs.slice(2)
  };

  // Secondary contract: LSP6KeyManager
  // Constructor: target (UP address) - will be injected by factory
  const secondaryContractDeployment = {
    fundingAmount: 0,
    creationBytecode: kmBytecode,
    addPrimaryContractAddress: true,
    extraConstructorParams: '0x'
  };

  console.log('   Salt:', ethers.hexlify(salt));
  console.log('');

  console.log('Step 2: Computing predicted addresses...');
  
  // Get predicted addresses
  const [predictedUP, predictedKM] = await factory.computeAddresses(
    primaryContractDeployment,
    secondaryContractDeployment,
    ethers.ZeroAddress,
    '0x'
  );

  console.log('   Predicted UP:', predictedUP);
  console.log('   Predicted KeyManager:', predictedKM);
  console.log('');

  console.log('Step 3: Deploying UP + KeyManager via LSP23...');
  
  const tx = await factory.deployContracts(
    primaryContractDeployment,
    secondaryContractDeployment,
    ethers.ZeroAddress,
    '0x',
    { value: 0, gasLimit: 8000000 }
  );

  console.log('   Transaction:', tx.hash);
  console.log('   Waiting for confirmation...');

  const receipt = await tx.wait();
  console.log('   ✅ Deployed in block:', receipt.blockNumber);
  console.log('   Gas used:', receipt.gasUsed.toString());
  console.log('');

  // Parse events to get actual addresses
  let deployedUP = predictedUP;
  let deployedKM = predictedKM;

  for (const log of receipt.logs) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed && parsed.name === 'DeployedContracts') {
        deployedUP = parsed.args.primaryContract;
        deployedKM = parsed.args.secondaryContract;
        break;
      }
    } catch (e) {
      // Continue
    }
  }

  console.log('Step 4: Verifying deployment...');
  
  const upCode = await provider.getCode(deployedUP);
  const kmCode = await provider.getCode(deployedKM);

  console.log('   UP Code Size:', upCode.length / 2 - 1, 'bytes');
  console.log('   KM Code Size:', kmCode.length / 2 - 1, 'bytes');
  console.log('');

  return {
    upAddress: deployedUP,
    keyManagerAddress: deployedKM,
    transactionHash: tx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString()
  };
}

async function configureCollectionUP(upAddress, kmAddress) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Configuring Collection UP');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const results = {};

  // Create contract instances
  const up = new ethers.Contract(upAddress, LSP0ERC725AccountABI.abi, wallet);

  // Step 1: Set LSP3Profile metadata
  console.log('Step 1: Setting LSP3Profile metadata...');
  try {
    const profileJson = JSON.stringify(lsp3Profile);
    const profileData = ethers.toUtf8Bytes(profileJson);

    const tx = await up.setData(LSP3_PROFILE_KEY, profileData, { gasLimit: 500000 });
    const receipt = await tx.wait();
    
    console.log('   ✅ LSP3Profile set');
    console.log('   Tx:', tx.hash);
    results.lsp3Profile = { success: true, txHash: tx.hash };
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    results.lsp3Profile = { success: false, error: e.message };
  }
  console.log('');

  // Step 2: Set LSP1 Universal Receiver Delegate
  console.log('Step 2: Setting LSP1 Universal Receiver Delegate...');
  try {
    const delegateData = ethers.zeroPadValue(LSP1_UNIVERSAL_RECEIVER_DELEGATE, 32);
    
    const tx = await up.setData(LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY, delegateData, { gasLimit: 300000 });
    await tx.wait();
    
    console.log('   ✅ LSP1 Delegate set');
    results.lsp1Delegate = { success: true };
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    results.lsp1Delegate = { success: false, error: e.message };
  }
  console.log('');

  // Step 3: Set controller permissions on UP directly
  // (before transferring ownership to KeyManager)
  console.log('Step 3: Setting controller permissions...');
  try {
    const controllerKey = LSP6_ADDRESS_PERMISSIONS_PREFIX + CONTROLLER_ADDRESS.toLowerCase().replace('0x', '');
    
    const tx = await up.setData(controllerKey, ALL_PERMISSIONS, { gasLimit: 300000 });
    await tx.wait();
    
    console.log('   ✅ Controller permissions set');
    console.log('   Controller:', CONTROLLER_ADDRESS);
    results.controllerPermissions = { success: true };
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    results.controllerPermissions = { success: false, error: e.message };
  }
  console.log('');

  // Step 4: Transfer ownership to KeyManager
  console.log('Step 4: Transferring ownership to KeyManager...');
  try {
    const tx = await up.transferOwnership(kmAddress, { gasLimit: 300000 });
    await tx.wait();
    
    console.log('   ✅ Ownership transferred to KeyManager');
    results.ownershipTransferred = { success: true };
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    results.ownershipTransferred = { success: false, error: e.message };
  }
  console.log('');

  // Step 5: Verify final ownership
  console.log('Step 5: Verifying ownership...');
  try {
    const currentOwner = await up.owner();
    const isKeyManagerOwner = currentOwner.toLowerCase() === kmAddress.toLowerCase();
    
    console.log('   Current Owner:', currentOwner);
    console.log('   Is KeyManager:', isKeyManagerOwner);
    
    if (isKeyManagerOwner) {
      console.log('   ✅ UP is properly owned by KeyManager');
      results.ownershipVerified = true;
    } else {
      console.log('   ⚠️ Warning: UP owner is not KeyManager');
      results.ownershipVerified = false;
    }
  } catch (e) {
    console.log('   ❌ Failed to verify:', e.message);
  }
  console.log('');

  return results;
}

async function verifyArchitecture(upAddress, kmAddress) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Verifying Architecture');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const up = new ethers.Contract(upAddress, LSP0ERC725AccountABI.abi, provider);
  const km = new ethers.Contract(kmAddress, LSP6KeyManagerABI.abi, provider);

  const checks = {};

  // Check 1: UP owner
  try {
    const owner = await up.owner();
    checks.owner = {
      address: owner,
      isKeyManager: owner.toLowerCase() === kmAddress.toLowerCase()
    };
    console.log('✓ Owner Check:', owner);
    console.log('  Is KeyManager:', checks.owner.isKeyManager ? '✅ YES' : '❌ NO');
  } catch (e) {
    console.log('✗ Owner Check failed:', e.message);
  }
  console.log('');

  // Check 2: KeyManager target
  try {
    const target = await km.target();
    checks.keyManagerTarget = {
      address: target,
      isUP: target.toLowerCase() === upAddress.toLowerCase()
    };
    console.log('✓ KeyManager Target:', target);
    console.log('  Is UP:', checks.keyManagerTarget.isUP ? '✅ YES' : '❌ NO');
  } catch (e) {
    console.log('✗ KeyManager Target check failed:', e.message);
  }
  console.log('');

  // Check 3: LSP3Profile
  try {
    const profileData = await up.getData(LSP3_PROFILE_KEY);
    checks.lsp3Profile = {
      exists: profileData && profileData !== '0x' && profileData.length > 2
    };
    console.log('✓ LSP3Profile:', checks.lsp3Profile.exists ? '✅ Set' : '❌ Not set');
  } catch (e) {
    console.log('✗ LSP3Profile check failed:', e.message);
  }
  console.log('');

  // Check 4: Controller permissions
  try {
    const controllerKey = LSP6_ADDRESS_PERMISSIONS_PREFIX + CONTROLLER_ADDRESS.toLowerCase().replace('0x', '');
    const permData = await up.getData(controllerKey);
    checks.controllerPermissions = {
      exists: permData && permData !== '0x' && permData.length > 2
    };
    console.log('✓ Controller Permissions:', checks.controllerPermissions.exists ? '✅ Set' : '❌ Not set');
  } catch (e) {
    console.log('✗ Controller Permissions check failed:', e.message);
  }
  console.log('');

  return checks;
}

// Execute deployment
deployProperCollectionUP()
  .then(async (deployment) => {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Deployment Complete!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📍 Collection UP:', deployment.upAddress);
    console.log('🔐 KeyManager:', deployment.keyManagerAddress);
    console.log('📦 Transaction:', deployment.transactionHash);
    console.log('');

    // Configure the UP
    const config = await configureCollectionUP(deployment.upAddress, deployment.keyManagerAddress);

    // Verify architecture
    const verification = await verifyArchitecture(deployment.upAddress, deployment.keyManagerAddress);

    // Save results
    const results = {
      timestamp: new Date().toISOString(),
      collectionUP: deployment.upAddress,
      keyManager: deployment.keyManagerAddress,
      controller: CONTROLLER_ADDRESS,
      deployment: {
        transactionHash: deployment.transactionHash,
        blockNumber: deployment.blockNumber,
        gasUsed: deployment.gasUsed
      },
      configuration: config,
      verification: verification,
      metadata: lsp3Profile,
      links: {
        wallet: `https://wallet.universalprofile.cloud/${deployment.upAddress}`,
        explorer: `https://explorer.execution.mainnet.lukso.network/address/${deployment.upAddress}`,
        kmExplorer: `https://explorer.execution.mainnet.lukso.network/address/${deployment.keyManagerAddress}`
      },
      nextSteps: [
        'Register this UP as a Collection in CollectionRegistry',
        'Verify controller permissions work via KeyManager',
        'Mint first Moment'
      ]
    };

    fs.writeFileSync('new-collection-up-deployment.json', JSON.stringify(results, null, 2));

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Results Summary');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('✅ New Collection UP Deployed:', deployment.upAddress);
    console.log('✅ KeyManager:', deployment.keyManagerAddress);
    console.log('');
    console.log('🔗 Links:');
    console.log('   Wallet:', results.links.wallet);
    console.log('   Explorer:', results.links.explorer);
    console.log('');
    console.log('📁 Results saved to: new-collection-up-deployment.json');
    console.log('');

    const isProperlyConfigured = verification.owner?.isKeyManager && 
                                  verification.keyManagerTarget?.isUP;

    if (isProperlyConfigured) {
      console.log('🎉 SUCCESS: UP is properly owned by KeyManager!');
    } else {
      console.log('⚠️  Warning: Architecture may need adjustment');
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
