const { ethers } = require('ethers');
const fs = require('fs');

const LSP23LinkedContractsFactoryABI = require('@lukso/lsp-smart-contracts/artifacts/LSP23LinkedContractsFactory.json');
const UniversalProfileABI = require('@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json');
const LSP6KeyManagerABI = require('@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json');
const LSP0ERC725AccountABI = require('@lukso/lsp-smart-contracts/artifacts/LSP0ERC725Account.json');

const RPC_URL = 'https://rpc.mainnet.lukso.network';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const CONTROLLER_ADDRESS = '0xE093A714960da1bF297522617BfC08132b62B86a';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
const LSP1_UNIVERSAL_RECEIVER_DELEGATE = '0x41b4c4667b99aa73dc6321d8c883f139e7ed6f1f';

const LSP3_PROFILE_KEY = '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5';
const LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY = '0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbdf6277f3cc0730c45b828b6db8b47';
const LSP6_ADDRESS_PERMISSIONS_PREFIX = '0x4b80742d0000000082ac0000';
const ALL_PERMISSIONS = '0x00000000000000000000000000000000000000000000000000000000007fbf3f';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  PROPER LSP23 Deployment - UP owned by KeyManager');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Deployer:', wallet.address);
console.log('Controller:', CONTROLLER_ADDRESS);

const lsp3Profile = {
  LSP3Profile: {
    name: "Forever Moments Collection",
    description: "A collection of eternal moments captured on the LUKSO blockchain.",
    links: [
      { title: "X / Twitter", url: "https://x.com/LUKSOAgent" },
      { title: "AGENTPO Token", url: "https://explorer.lukso.network/address/0x47568BC4DC7Fee1bB67f741BA927e2904B61f016" }
    ],
    tags: ["AI", "LUKSO", "moments", "collection", "NFT"],
    profileImage: [],
    backgroundImage: []
  }
};

async function main() {
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'LYX\n');

  const factory = new ethers.Contract(LSP23_FACTORY, LSP23LinkedContractsFactoryABI.abi, wallet);

  console.log('Step 1: Preparing deployment with proper ownership...');

  // The key insight: we need to use the LSP23 factory's ability to:
  // 1. Deploy the KeyManager first
  // 2. Use that address as the owner in the UP constructor
  // OR use reverseBootstrapping to deploy UP first then KM with proper linkage

  const salt = ethers.randomBytes(32);
  const upBytecode = UniversalProfileABI.bytecode;
  const kmBytecode = LSP6KeyManagerABI.bytecode;

  // For proper architecture:
  // We deploy KeyManager first (as secondary) with the UP address as target
  // Then deploy UP with KeyManager as owner
  // But since UP doesn't exist yet, we use reverseBootstrapping = true
  
  // With reverseBootstrapping = true:
  // - Secondary contract (KeyManager) is deployed first
  // - Primary contract (UP) is deployed second
  // - UP constructor gets KeyManager address via addPrimaryContractAddress logic

  // Actually, looking at LSP23 more carefully:
  // The proper way is to deploy UP with a temporary owner (deployer)
  // Then immediately transfer to KeyManager as part of the same transaction
  // Using postDeploymentModule

  // For now, let's use the standard approach but with correct initialization
  // We'll set the KeyManager as owner from the start using predicted address

  // Predict addresses first
  const tempUpArgs = ethers.AbiCoder.defaultAbiCoder().encode(['address'], [wallet.address]);
  const tempPrimary = {
    salt: salt,
    fundingAmount: 0,
    creationBytecode: upBytecode + tempUpArgs.slice(2)
  };
  const tempSecondary = {
    fundingAmount: 0,
    creationBytecode: kmBytecode,
    addPrimaryContractAddress: true,
    extraConstructorParams: '0x'
  };

  const [predictedUP, predictedKM] = await factory.computeAddresses(
    tempPrimary, tempSecondary, ethers.ZeroAddress, '0x'
  );

  console.log('Predicted UP:', predictedUP);
  console.log('Predicted KeyManager:', predictedKM);

  // Now prepare real deployment with KeyManager as owner
  // The UP constructor takes initialOwner - we'll use the predicted KeyManager address
  const upConstructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(['address'], [predictedKM]);
  const primaryContractDeployment = {
    salt: salt,
    fundingAmount: 0,
    creationBytecode: upBytecode + upConstructorArgs.slice(2)
  };

  // KeyManager needs UP address as target
  const secondaryContractDeployment = {
    fundingAmount: 0,
    creationBytecode: kmBytecode,
    addPrimaryContractAddress: true,
    extraConstructorParams: '0x'
  };

  console.log('\nStep 2: Deploying with KeyManager as initial owner...');
  console.log('UP will be owned by:', predictedKM);

  const tx = await factory.deployContracts(
    primaryContractDeployment,
    secondaryContractDeployment,
    false, // reverseBootstrapping
    wallet.address,
    '0x',
    { value: 0, gasLimit: 8000000 }
  );

  console.log('Transaction:', tx.hash);
  const receipt = await tx.wait();
  console.log('Deployed in block:', receipt.blockNumber);

  // Parse actual addresses
  let deployedUP = predictedUP;
  let deployedKM = predictedKM;
  for (const log of receipt.logs) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed?.name === 'DeployedContracts') {
        deployedUP = parsed.args.primaryContract;
        deployedKM = parsed.args.secondaryContract;
        break;
      }
    } catch (e) {}
  }

  console.log('\n✅ Deployed:');
  console.log('UP:', deployedUP);
  console.log('KeyManager:', deployedKM);

  // Verify ownership immediately
  console.log('\nStep 3: Verifying ownership...');
  const up = new ethers.Contract(deployedUP, LSP0ERC725AccountABI.abi, provider);
  const owner = await up.owner();
  console.log('Owner:', owner);
  console.log('Is KeyManager:', owner.toLowerCase() === deployedKM.toLowerCase());

  if (owner.toLowerCase() !== deployedKM.toLowerCase()) {
    console.log('\n❌ ERROR: UP is not owned by KeyManager!');
    console.log('This deployment failed to set proper ownership.');
    return;
  }

  console.log('\nStep 4: Configuring UP...');
  const upWithSigner = new ethers.Contract(deployedUP, LSP0ERC725AccountABI.abi, wallet);

  // Set LSP3Profile
  console.log('Setting LSP3Profile...');
  const profileData = ethers.toUtf8Bytes(JSON.stringify(lsp3Profile));
  await (await upWithSigner.setData(LSP3_PROFILE_KEY, profileData, { gasLimit: 500000 })).wait();
  console.log('✓ LSP3Profile set');

  // Set LSP1 Delegate
  console.log('Setting LSP1 Delegate...');
  const delegateData = ethers.zeroPadValue(LSP1_UNIVERSAL_RECEIVER_DELEGATE, 32);
  await (await upWithSigner.setData(LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY, delegateData, { gasLimit: 300000 })).wait();
  console.log('✓ LSP1 Delegate set');

  // Set controller permissions
  console.log('Setting controller permissions...');
  const controllerKey = LSP6_ADDRESS_PERMISSIONS_PREFIX + CONTROLLER_ADDRESS.toLowerCase().replace('0x', '');
  await (await upWithSigner.setData(controllerKey, ALL_PERMISSIONS, { gasLimit: 300000 })).wait();
  console.log('✓ Controller permissions set');

  // Verify everything
  console.log('\nStep 5: Final verification...');
  const finalOwner = await up.owner();
  const profileSet = await up.getData(LSP3_PROFILE_KEY);
  const permSet = await up.getData(controllerKey);

  console.log('Owner is KeyManager:', finalOwner.toLowerCase() === deployedKM.toLowerCase() ? '✅' : '❌');
  console.log('LSP3Profile set:', profileSet && profileSet !== '0x' ? '✅' : '❌');
  console.log('Controller permissions:', permSet && permSet !== '0x' ? '✅' : '❌');

  const results = {
    timestamp: new Date().toISOString(),
    collectionUP: deployedUP,
    keyManager: deployedKM,
    controller: CONTROLLER_ADDRESS,
    deploymentTx: tx.hash,
    owner: finalOwner,
    isProperlyConfigured: finalOwner.toLowerCase() === deployedKM.toLowerCase(),
    links: {
      wallet: `https://wallet.universalprofile.cloud/${deployedUP}`,
      explorer: `https://explorer.execution.mainnet.lukso.network/address/${deployedUP}`,
      kmExplorer: `https://explorer.execution.mainnet.lukso.network/address/${deployedKM}`
    }
  };

  fs.writeFileSync('proper-collection-up.json', JSON.stringify(results, null, 2));
  console.log('\n✅ Results saved to proper-collection-up.json');
  console.log('\n🔗 Collection UP:', deployedUP);
  console.log('🎉 SUCCESS! UP is properly owned by KeyManager from deployment.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
