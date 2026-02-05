const { ethers } = require('ethers');
const fs = require('fs');

// Import ABIs
const LSP23LinkedContractsFactoryABI = require('@lukso/lsp-smart-contracts/artifacts/LSP23LinkedContractsFactory.json');
const UniversalProfileABI = require('@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json');
const LSP6KeyManagerABI = require('@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json');
const LSP0ERC725AccountABI = require('@lukso/lsp-smart-contracts/artifacts/LSP0ERC725Account.json');

const RPC_URL = 'https://rpc.mainnet.lukso.network';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const CONTROLLER_ADDRESS = '0xE093A714960da1bF297522617BfC08132b62B86a';

console.log('Starting deployment script...');
console.log('Controller:', CONTROLLER_ADDRESS);

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
const LSP1_UNIVERSAL_RECEIVER_DELEGATE = '0x41b4c4667b99aa73dc6321d8c883f139e7ed6f1f';

const LSP3_PROFILE_KEY = '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5';
const LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY = '0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbdf6277f3cc0730c45b828b6db8b47';
const LSP6_ADDRESS_PERMISSIONS_PREFIX = '0x4b80742d0000000082ac0000';
const ALL_PERMISSIONS = '0x00000000000000000000000000000000000000000000000000000000007fbf3f';

const lsp3Profile = {
  LSP3Profile: {
    name: "Forever Moments Collection",
    description: "A collection of eternal moments captured on the LUKSO blockchain. Created by LUKSOAgent.",
    links: [
      { title: "X / Twitter", url: "https://x.com/LUKSOAgent" },
      { title: "AGENTPO Token", url: "https://explorer.lukso.network/address/0x47568BC4DC7Fee1bB67f741BA927e2904B61f016" }
    ],
    tags: ["AI", "LUKSO", "moments", "collection", "NFT", "forever"],
    profileImage: [],
    backgroundImage: []
  }
};

async function main() {
  try {
    console.log('Wallet address:', wallet.address);
    
    const balance = await provider.getBalance(wallet.address);
    console.log('Balance:', ethers.formatEther(balance), 'LYX');

    if (balance < ethers.parseEther('0.3')) {
      throw new Error('Insufficient balance');
    }

    console.log('\nConnecting to LSP23 Factory...');
    const factory = new ethers.Contract(LSP23_FACTORY, LSP23LinkedContractsFactoryABI.abi, wallet);
    console.log('Factory connected at:', LSP23_FACTORY);

    console.log('\nPreparing deployment...');
    const salt = ethers.randomBytes(32);
    console.log('Salt generated');

    const upBytecode = UniversalProfileABI.bytecode;
    const kmBytecode = LSP6KeyManagerABI.bytecode;
    console.log('Bytecode loaded');

    const upConstructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(['address'], [wallet.address]);
    const primaryContractDeployment = {
      salt: salt,
      fundingAmount: 0,
      creationBytecode: upBytecode + upConstructorArgs.slice(2)
    };

    const secondaryContractDeployment = {
      fundingAmount: 0,
      creationBytecode: kmBytecode,
      addPrimaryContractAddress: true,
      extraConstructorParams: '0x'
    };

    console.log('\nComputing predicted addresses...');
    const [predictedUP, predictedKM] = await factory.computeAddresses(
      primaryContractDeployment,
      secondaryContractDeployment,
      ethers.ZeroAddress,
      '0x'
    );
    console.log('Predicted UP:', predictedUP);
    console.log('Predicted KM:', predictedKM);

    console.log('\nDeploying contracts...');
    const tx = await factory.deployContracts(
      primaryContractDeployment,
      secondaryContractDeployment,
      ethers.ZeroAddress,
      '0x',
      { value: 0, gasLimit: 8000000 }
    );
    console.log('Transaction sent:', tx.hash);

    console.log('Waiting for confirmation (this may take 30-60 seconds)...');
    const receipt = await tx.wait();
    console.log('Confirmed in block:', receipt.blockNumber);

    // Parse events
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
      } catch (e) {}
    }

    console.log('\n✅ Contracts deployed!');
    console.log('UP:', deployedUP);
    console.log('KeyManager:', deployedKM);

    // Configuration
    console.log('\n--- Configuration Phase ---');
    const up = new ethers.Contract(deployedUP, LSP0ERC725AccountABI.abi, wallet);

    // Set LSP3Profile
    console.log('Setting LSP3Profile...');
    const profileJson = JSON.stringify(lsp3Profile);
    const profileData = ethers.toUtf8Bytes(profileJson);
    const tx1 = await up.setData(LSP3_PROFILE_KEY, profileData, { gasLimit: 500000 });
    await tx1.wait();
    console.log('✓ LSP3Profile set');

    // Set LSP1 Delegate
    console.log('Setting LSP1 Delegate...');
    const delegateData = ethers.zeroPadValue(LSP1_UNIVERSAL_RECEIVER_DELEGATE, 32);
    const tx2 = await up.setData(LSP1_UNIVERSAL_RECEIVER_DELEGATE_KEY, delegateData, { gasLimit: 300000 });
    await tx2.wait();
    console.log('✓ LSP1 Delegate set');

    // Set controller permissions
    console.log('Setting controller permissions...');
    const controllerKey = LSP6_ADDRESS_PERMISSIONS_PREFIX + CONTROLLER_ADDRESS.toLowerCase().replace('0x', '');
    const tx3 = await up.setData(controllerKey, ALL_PERMISSIONS, { gasLimit: 300000 });
    await tx3.wait();
    console.log('✓ Controller permissions set');

    // Transfer ownership to KeyManager
    console.log('Transferring ownership to KeyManager...');
    const tx4 = await up.transferOwnership(deployedKM, { gasLimit: 300000 });
    await tx4.wait();
    console.log('✓ Ownership transferred');

    // Verify
    console.log('\n--- Verification ---');
    const owner = await up.owner();
    console.log('Current owner:', owner);
    console.log('Is KeyManager:', owner.toLowerCase() === deployedKM.toLowerCase());

    // Save results
    const results = {
      timestamp: new Date().toISOString(),
      collectionUP: deployedUP,
      keyManager: deployedKM,
      controller: CONTROLLER_ADDRESS,
      deploymentTx: tx.hash,
      owner: owner,
      isProperlyConfigured: owner.toLowerCase() === deployedKM.toLowerCase(),
      links: {
        wallet: `https://wallet.universalprofile.cloud/${deployedUP}`,
        explorer: `https://explorer.execution.mainnet.lukso.network/address/${deployedUP}`
      }
    };

    fs.writeFileSync('new-collection-up-deployment.json', JSON.stringify(results, null, 2));
    console.log('\n✅ Results saved to new-collection-up-deployment.json');
    console.log('\n🔗 Collection UP:', deployedUP);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) console.error('Error code:', error.code);
    process.exit(1);
  }
}

main();
