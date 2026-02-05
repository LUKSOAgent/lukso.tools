const { ethers } = require('ethers');
const fs = require('fs');

// Setup provider and wallet
const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const CONTROLLER_ADDRESS = '0xE093A714960da1bF297522617BfC08132b62B86a';

const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log('═══════════════════════════════════════════════════════════════');
console.log('  PROPER Collection UP Deployment via LSP23');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Controller Address:', CONTROLLER_ADDRESS);
console.log('Deployer Address:', wallet.address);
console.log('');

// LSP23 LinkedContractsFactory on LUKSO Mainnet
const LSP23_FACTORY_ADDRESS = '0x2300000fEf1E29E660A0cD4b96b9E7a3B8799435';

// LSP0 ERC725Account implementation
const LSP0_IMPLEMENTATION = '0xDdE7A8F988c088C1F81d81F5dB8288f6154B5e6E';

// LSP6 KeyManager implementation
const LSP6_IMPLEMENTATION = '0x669d5EcAf866961931DA21594c1F26824831BE9D';

// LSP1 Universal Receiver Delegate
const LSP1_UNIVERSAL_RECEIVER_DELEGATE = '0x41b4c4667b99aa73dc6321d8c883f139e7ed6f1f';

// LSP23 Factory ABI (simplified for deployment)
const LSP23_FACTORY_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "implementationContract", "type": "address" },
          { "internalType": "bytes", "name": "initializationCallData", "type": "bytes" }
        ],
        "internalType": "struct ILSP23LinkedContractsFactory.ContractDeployment",
        "name": "primaryContractDeployment",
        "type": "tuple"
      },
      {
        "components": [
          { "internalType": "address", "name": "implementationContract", "type": "address" },
          { "internalType": "bytes", "name": "initializationCallData", "type": "bytes" },
          { "internalType": "bytes32", "name": "addPrimaryContractAddress", "type": "bytes32" },
          { "internalType": "bytes", "name": "extraInitializationParams", "type": "bytes" }
        ],
        "internalType": "struct ILSP23LinkedContractsFactory.ContractDeployment",
        "name": "secondaryContractDeployment",
        "type": "tuple"
      },
      { "internalType": "bool", "name": "reverseBootstrapping", "type": "bool" },
      { "internalType": "address", "name": "controller", "type": "address" },
      { "internalType": "bytes", "name": "postDeploymentCallData", "type": "bytes" }
    ],
    "name": "deployERC1167Proxies",
    "outputs": [
      { "internalType": "address", "name": "primaryContract", "type": "address" },
      { "internalType": "address", "name": "secondaryContract", "type": "address" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "implementationContract", "type": "address" },
          { "internalType": "bytes", "name": "initializationCallData", "type": "bytes" }
        ],
        "internalType": "struct ILSP23LinkedContractsFactory.ContractDeployment",
        "name": "primaryContractDeployment",
        "type": "tuple"
      },
      {
        "components": [
          { "internalType": "address", "name": "implementationContract", "type": "address" },
          { "internalType": "bytes", "name": "initializationCallData", "type": "bytes" },
          { "internalType": "bytes32", "name": "addPrimaryContractAddress", "type": "bytes32" },
          { "internalType": "bytes", "name": "extraInitializationParams", "type": "bytes" }
        ],
        "internalType": "struct ILSP23LinkedContractsFactory.ContractDeployment",
        "name": "secondaryContractDeployment",
        "type": "tuple"
      },
      { "internalType": "bool", "name": "reverseBootstrapping", "type": "bool" },
      { "internalType": "address", "name": "controller", "type": "address" },
      { "internalType": "bytes", "name": "postDeploymentCallData", "type": "bytes" }
    ],
    "name": "deployERC1167ProxiesPredictAddresses",
    "outputs": [
      { "internalType": "address", "name": "primaryContract", "type": "address" },
      { "internalType": "address", "name": "secondaryContract", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// LSP0 ERC725Account ABI (for initialization)
const LSP0_ABI = [
  "function initialize(address initialOwner) external",
  "function owner() view returns (address)",
  "function setData(bytes32 dataKey, bytes memory dataValue) external",
  "function getData(bytes32 dataKey) view returns (bytes memory)",
  "function transferOwnership(address newOwner) external",
  "function acceptOwnership() external"
];

// LSP6 KeyManager ABI
const LSP6_ABI = [
  "function initialize(address target, bytes memory permissions) external",
  "function target() view returns (address)",
  "function execute(bytes memory payload) external returns (bytes memory)",
  "function setPermissions(address controller, bytes32 permissions) external",
  "function getPermissions(address controller) view returns (bytes32)"
];

// Data keys
const LSP3_PROFILE_KEY = '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5';
const LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY = '0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbdf6277f3cc0730c45b828b6db8b47';
const LSP6_KEY_MANAGER_KEY = '0xeafec4d89fa9619883b6b2550701721c064bb27b5025b6b3144a4cd637cc77e3';
const LSP6_ADDRESS_PERMISSIONS_PREFIX = '0x4b80742d0000000082ac0000';

// ALL_PERMISSIONS for controller
const ALL_PERMISSIONS = '0x00000000000000000000000000000000000000000000000000000000007fbf3f';

// Create LSP3 Profile metadata
const lsp3Profile = {
  LSP3Profile: {
    name: "Forever Moments Collection",
    description: "A collection of eternal moments captured on the LUKSO blockchain by LUKSOAgent.",
    links: [
      { title: "X / Twitter", url: "https://x.com/LUKSOAgent" },
      { title: "AGENTPO Token", url: "https://explorer.lukso.network/address/0x47568BC4DC7Fee1bB67f741BA927e2904B61f016" }
    ],
    tags: ["AI", "LUKSO", "moments", "collection", "NFT"],
    profileImage: [],
    backgroundImage: []
  }
};

async function deployProperCollectionUP() {
  console.log('Step 1: Checking wallet balance...');
  const balance = await provider.getBalance(wallet.address);
  console.log('   Balance:', ethers.formatEther(balance), 'LYX');
  console.log('');

  if (balance < ethers.parseEther('0.5')) {
    console.error('❌ Insufficient balance. Need at least 0.5 LYX for deployment.');
    process.exit(1);
  }

  console.log('Step 2: Preparing deployment parameters...');

  // Create factory instance
  const factory = new ethers.Contract(LSP23_FACTORY_ADDRESS, LSP23_FACTORY_ABI, wallet);

  // Encode initialization data for LSP0 (UP)
  // For LSP0, we initialize with the KeyManager as owner (set later)
  // We'll use a placeholder address first, then transfer ownership
  const lsp0InitData = new ethers.Interface(LSP0_ABI).encodeFunctionData('initialize', [
    wallet.address // Temporary owner - will be transferred to KeyManager
  ]);

  // Primary contract deployment (LSP0/UP)
  const primaryDeployment = {
    implementationContract: LSP0_IMPLEMENTATION,
    initializationCallData: lsp0InitData
  };

  // Encode initialization data for LSP6 (KeyManager)
  // For LSP6, we need: target address + permissions
  // The target will be the deployed UP address
  // We'll add the controller with ALL_PERMISSIONS
  const lsp6InitData = new ethers.Interface(LSP6_ABI).encodeFunctionData('initialize', [
    ethers.ZeroAddress, // Placeholder - will be replaced with actual UP address
    '0x' // Empty permissions initially
  ]);

  // Secondary contract deployment (LSP6/KeyManager)
  // The addPrimaryContractAddress tells the factory where to insert the UP address
  const secondaryDeployment = {
    implementationContract: LSP6_IMPLEMENTATION,
    initializationCallData: lsp6InitData,
    addPrimaryContractAddress: '0x0000000000000000000000000000000000000000000000000000000000000000', // Insert at beginning for target param
    extraInitializationParams: '0x'
  };

  console.log('   Primary (UP) Implementation:', LSP0_IMPLEMENTATION);
  console.log('   Secondary (KeyManager) Implementation:', LSP6_IMPLEMENTATION);
  console.log('');

  console.log('Step 3: Predicting deployment addresses...');
  try {
    const [predictedUP, predictedKM] = await factory.deployERC1167ProxiesPredictAddresses.staticCall(
      primaryDeployment,
      secondaryDeployment,
      false, // reverseBootstrapping
      wallet.address, // controller
      '0x' // postDeploymentCallData
    );

    console.log('   Predicted UP Address:', predictedUP);
    console.log('   Predicted KeyManager Address:', predictedKM);
    console.log('');

    console.log('Step 4: Deploying contracts...');
    console.log('   This may take a moment...');

    // Deploy the linked contracts
    const tx = await factory.deployERC1167Proxies(
      primaryDeployment,
      secondaryDeployment,
      false, // reverseBootstrapping
      wallet.address, // controller
      '0x', // postDeploymentCallData
      {
        gasLimit: 5000000,
        value: 0
      }
    );

    console.log('   Transaction sent:', tx.hash);
    console.log('   Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log('   ✅ Deployment confirmed!');
    console.log('   Block Number:', receipt.blockNumber);
    console.log('   Gas Used:', receipt.gasUsed.toString());
    console.log('');

    // Parse events to get actual addresses
    let deployedUP = null;
    let deployedKM = null;

    for (const log of receipt.logs) {
      try {
        // Try to decode as address (32 bytes topic)
        if (log.topics.length >= 2) {
          const addr = '0x' + log.topics[1].slice(-40);
          if (!deployedUP && log.address.toLowerCase() === LSP23_FACTORY_ADDRESS.toLowerCase()) {
            deployedUP = addr;
          }
        }
      } catch (e) {
        // Ignore decode errors
      }
    }

    // If we couldn't parse events, use predicted addresses
    if (!deployedUP) deployedUP = predictedUP;
    if (!deployedKM) deployedKM = predictedKM;

    console.log('Step 5: Verifying deployment...');
    console.log('   Deployed UP:', deployedUP);
    console.log('   Deployed KeyManager:', deployedKM);

    // Verify UP exists
    const upCode = await provider.getCode(deployedUP);
    console.log('   UP Code Size:', upCode.length / 2 - 1, 'bytes');

    // Verify KeyManager exists
    const kmCode = await provider.getCode(deployedKM);
    console.log('   KeyManager Code Size:', kmCode.length / 2 - 1, 'bytes');
    console.log('');

    return {
      upAddress: deployedUP,
      keyManagerAddress: deployedKM,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    if (error.data) {
      console.error('   Error data:', error.data);
    }
    throw error;
  }
}

async function configureNewUP(upAddress, kmAddress) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Configuring New Collection UP');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const results = {
    lsp3ProfileSet: false,
    lsp1DelegateSet: false,
    permissionsSet: false,
    ownershipTransferred: false
  };

  // Create contract instances
  const up = new ethers.Contract(upAddress, LSP0_ABI, wallet);
  const km = new ethers.Contract(kmAddress, LSP6_ABI, wallet);

  // Step 1: Set LSP3Profile metadata
  console.log('Step 1: Setting LSP3Profile metadata...');
  try {
    const profileJson = JSON.stringify(lsp3Profile);
    const profileBytes = ethers.toUtf8Bytes(profileJson);

    const tx = await up.setData(LSP3_PROFILE_KEY, profileBytes, {
      gasLimit: 500000
    });
    await tx.wait();

    console.log('   ✅ LSP3Profile set');
    results.lsp3ProfileSet = true;
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
  }
  console.log('');

  // Step 2: Set LSP1 Universal Receiver Delegate
  console.log('Step 2: Setting LSP1 Universal Receiver Delegate...');
  try {
    const delegateAddress = LSP1_UNIVERSAL_RECEIVER_DELEGATE;
    const delegateBytes = ethers.zeroPadValue(delegateAddress, 32);

    const tx = await up.setData(LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY, delegateBytes, {
      gasLimit: 300000
    });
    await tx.wait();

    console.log('   ✅ LSP1 Delegate set');
    results.lsp1DelegateSet = true;
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
  }
  console.log('');

  // Step 3: Transfer ownership to KeyManager
  console.log('Step 3: Transferring ownership to KeyManager...');
  try {
    const tx = await up.transferOwnership(kmAddress, {
      gasLimit: 300000
    });
    await tx.wait();

    console.log('   ✅ Ownership transferred to KeyManager');
    results.ownershipTransferred = true;
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
  }
  console.log('');

  // Step 4: Verify ownership
  console.log('Step 4: Verifying ownership...');
  try {
    const currentOwner = await up.owner();
    console.log('   Current Owner:', currentOwner);
    console.log('   Is KeyManager:', currentOwner.toLowerCase() === kmAddress.toLowerCase());

    if (currentOwner.toLowerCase() === kmAddress.toLowerCase()) {
      console.log('   ✅ UP is properly owned by KeyManager');
      results.ownershipVerified = true;
    } else {
      console.log('   ⚠️ UP owner does not match KeyManager');
    }
  } catch (e) {
    console.log('   ❌ Failed to verify:', e.message);
  }
  console.log('');

  return results;
}

// Execute deployment
deployProperCollectionUP()
  .then(async (deployment) => {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Deployment Successful!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📍 Collection UP Address:', deployment.upAddress);
    console.log('🔐 KeyManager Address:', deployment.keyManagerAddress);
    console.log('📦 Transaction Hash:', deployment.transactionHash);
    console.log('');

    // Configure the new UP
    const config = await configureNewUP(deployment.upAddress, deployment.keyManagerAddress);

    // Save results
    const results = {
      timestamp: new Date().toISOString(),
      deployment: {
        upAddress: deployment.upAddress,
        keyManagerAddress: deployment.keyManagerAddress,
        transactionHash: deployment.transactionHash,
        blockNumber: deployment.blockNumber,
        gasUsed: deployment.gasUsed
      },
      configuration: config,
      metadata: lsp3Profile,
      links: {
        wallet: `https://wallet.universalprofile.cloud/${deployment.upAddress}`,
        explorer: `https://explorer.execution.mainnet.lukso.network/address/${deployment.upAddress}`,
        kmExplorer: `https://explorer.execution.mainnet.lukso.network/address/${deployment.keyManagerAddress}`
      }
    };

    fs.writeFileSync('new-collection-up-deployment.json', JSON.stringify(results, null, 2));
    console.log('Results saved to: new-collection-up-deployment.json');
    console.log('');

    console.log('🔗 Links:');
    console.log('   Wallet:', results.links.wallet);
    console.log('   Explorer:', results.links.explorer);
    console.log('   KeyManager:', results.links.kmExplorer);
    console.log('');

    console.log('⚠️  IMPORTANT NEXT STEPS:');
    console.log('   1. Register this UP as a Collection in CollectionRegistry');
    console.log('   2. Set controller permissions via KeyManager');
    console.log('   3. Create your first Moment');
    console.log('');

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
