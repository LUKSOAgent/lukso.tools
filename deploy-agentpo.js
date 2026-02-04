const { ethers } = require('ethers');
const fs = require('fs');
const LSP7Mintable = require('@lukso/lsp-smart-contracts/artifacts/LSP7Mintable.json');

// Read credentials
const credsFile = fs.readFileSync('.credentials', 'utf8');
const lines = credsFile.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const keyManagerAddress = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const upAddress = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const jordyUP = '0x378Be8577ede94b9d4b9F45447F21B826501bab8';

// Token config
const TOKEN_NAME = 'Agent Potato';
const TOKEN_SYMBOL = 'AGENTPO';

async function deployToken() {
  try {
    console.log('🚀 Deploying LSP7Mintable Token...\n');
    console.log('Name:', TOKEN_NAME);
    console.log('Symbol:', TOKEN_SYMBOL);
    console.log('Owner (my UP):', upAddress);
    console.log('');
    
    const keyManager = new ethers.Contract(keyManagerAddress, [
      'function execute(bytes calldata payload) external payable returns (bytes memory)'
    ], wallet);
    
    // Create contract factory
    const factory = new ethers.ContractFactory(LSP7Mintable.abi, LSP7Mintable.bytecode);
    
    // Encode constructor parameters
    // name_, symbol_, newOwner_, lsp4TokenType_, isNonDivisible_
    const deployData = factory.interface.encodeDeploy([
      TOKEN_NAME,
      TOKEN_SYMBOL,
      upAddress, // Owner is my UP
      0, // Token type 0 = regular
      false // Divisible token (not NFT)
    ]);
    
    // Full deployment bytecode
    const fullBytecode = ethers.concat([LSP7Mintable.bytecode, deployData]);
    
    // Deploy via UP using CREATE (operation type 1)
    const upInterface = new ethers.Interface([
      'function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)'
    ]);
    
    const executeCalldata = upInterface.encodeFunctionData('execute', [
      1, // CREATE operation
      ethers.ZeroAddress, // Target is 0 for CREATE
      0, // No value
      fullBytecode
    ]);
    
    console.log('Sending deployment transaction...');
    console.log('Estimated bytecode size:', fullBytecode.length / 2, 'bytes');
    
    const tx = await keyManager.execute(executeCalldata, { gasLimit: 5000000 });
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...\n');
    
    const receipt = await tx.wait();
    
    console.log('✅ Token deployed successfully!');
    console.log('Transaction hash:', receipt.hash);
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Find deployed address from event
    // The Created event should contain the new contract address
    const deployedAddress = receipt.logs[0]?.address;
    console.log('Deployed address:', deployedAddress || 'Check logs for address');
    
    // Save deployment info
    const deploymentInfo = {
      name: TOKEN_NAME,
      symbol: TOKEN_SYMBOL,
      address: deployedAddress,
      deployer: upAddress,
      txHash: receipt.hash,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('/root/.openclaw/workspace/agentpo-token.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('\n💾 Deployment saved to agentpo-token.json');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error('Not enough LYX for gas fees');
    }
  }
}

deployToken();