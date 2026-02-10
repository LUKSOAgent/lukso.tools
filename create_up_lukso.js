const { ethers } = require('ethers');

// LUKSO Testnet Configuration
const LUKSO_TESTNET_RPC = 'https://rpc.testnet.lukso.network';
const LUKSO_TESTNET_CHAIN_ID = 4201;

async function createUniversalProfile() {
  console.log('=== LUKSO Universal Profile Creation ===\n');
  
  // Generate random number for the name
  const randomNum = Math.floor(Math.random() * 100000);
  
  // Step 1: Generate a new EOA wallet (controller key)
  const wallet = ethers.Wallet.createRandom();
  console.log('=== Controller Wallet Generated ===');
  console.log('Controller Address:', wallet.address);
  console.log('Private Key:', wallet.privateKey);
  console.log('');
  
  // Connect to LUKSO Testnet (ethers v6 syntax)
  const provider = new ethers.JsonRpcProvider(LUKSO_TESTNET_RPC);
  const network = await provider.getNetwork();
  
  console.log('=== Connected to LUKSO Testnet ===');
  console.log('Network Name:', network.name);
  console.log('Chain ID:', network.chainId.toString());
  console.log('');
  
  console.log('=== Profile Metadata ===');
  const profileData = {
    name: `TestAgent-${randomNum}`,
    description: "Sub-agent testing UP creation",
    tags: ["test", "agent", "sub-agent"],
    controllerAddress: wallet.address
  };
  console.log(JSON.stringify(profileData, null, 2));
  console.log('');
  
  // Create the profile metadata in LSP3 format
  const LSP3Profile = {
    LSP3Profile: {
      name: profileData.name,
      description: profileData.description,
      tags: profileData.tags,
      links: []
    }
  };
  
  console.log('=== LSP3 Profile Metadata ===');
  console.log(JSON.stringify(LSP3Profile, null, 2));
  console.log('');
  
  // Check controller balance
  const balance = await provider.getBalance(wallet.address);
  console.log('=== Controller Account Status ===');
  console.log('Balance:', ethers.formatEther(balance), 'LYX');
  console.log('');
  
  // LSP23 Factory address on LUKSO Testnet
  const LSP23_FACTORY_ADDRESS = '0x201d012fD0aa6DeE57e4E8b376Ffcc42833CbA2d';
  
  console.log('=== Deployment Information ===');
  console.log('Network: LUKSO Testnet');
  console.log('RPC:', LUKSO_TESTNET_RPC);
  console.log('Chain ID:', LUKSO_TESTNET_CHAIN_ID);
  console.log('Explorer: https://explorer.execution.testnet.lukso.network');
  console.log('');
  console.log('LSP23 Factory:', LSP23_FACTORY_ADDRESS);
  console.log('');
  
  if (balance === 0n) {
    console.log('⚠️  Controller wallet has no test LYX!');
    console.log('   To deploy, fund this address with test LYX from:');
    console.log('   https://faucet.testnet.lukso.network');
    console.log('');
  }
  
  // Save credentials
  const credentials = {
    timestamp: new Date().toISOString(),
    network: {
      name: 'LUKSO Testnet',
      rpc: LUKSO_TESTNET_RPC,
      chainId: Number(network.chainId),
      explorer: 'https://explorer.execution.testnet.lukso.network'
    },
    controller: {
      address: wallet.address,
      privateKey: wallet.privateKey
    },
    profile: profileData,
    lsp3Metadata: LSP3Profile,
    deployment: {
      factory: LSP23_FACTORY_ADDRESS,
      funded: balance > 0n,
      balance: ethers.formatEther(balance) + ' LYX',
      deployed: false
    }
  };
  
  require('fs').writeFileSync(
    './up_credentials.json', 
    JSON.stringify(credentials, null, 2)
  );
  
  console.log('=== Credentials Saved ===');
  console.log('File: up_credentials.json');
  console.log('');
  console.log('Summary:');
  console.log('  Controller Address:', wallet.address);
  console.log('  Profile Name:', profileData.name);
  console.log('  Balance:', ethers.formatEther(balance), 'LYX');
  console.log('');
  console.log('Status: Wallet generated and metadata prepared.');
  
  return {
    controllerAddress: wallet.address,
    privateKey: wallet.privateKey,
    profileName: profileData.name,
    credentialsFile: './up_credentials.json'
  };
}

createUniversalProfile()
  .then((result) => {
    console.log('\n=== Task Complete ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
