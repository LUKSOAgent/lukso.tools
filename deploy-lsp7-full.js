const { ethers } = require('ethers');
const fs = require('fs');
const LSP7 = require('@lukso/lsp-smart-contracts/artifacts/LSP7DigitalAsset.json');

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

async function deployLSP7() {
  try {
    console.log('🚀 Deploying LSP7 Token...\n');
    
    const keyManager = new ethers.Contract(keyManagerAddress, [
      'function execute(bytes calldata payload) external payable returns (bytes memory)'
    ], wallet);
    
    const upContract = new ethers.Contract(upAddress, [
      'function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)'
    ]);
    
    // Create LSP7 factory
    const factory = new ethers.ContractFactory(LSP7.abi, LSP7.bytecode, wallet);
    
    // Encode constructor: name, symbol, owner, tokenType, isNFT
    const deployData = factory.interface.encodeDeploy([
      TOKEN_NAME,
      TOKEN_SYMBOL,
      upAddress, // Owner is my UP
      0, // Token type 0 = regular
      false // Not an NFT
    ]);
    
    // Deploy via UP (CREATE operation = 1)
    const upInterface = new ethers.Interface([
      'function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)'
    ]);
    
    // For CREATE, target is address(0)
    const executeCalldata = upInterface.encodeFunctionData('execute', [
      1, // CREATE operation
      ethers.ZeroAddress,
      0,
      ethers.concat([LSP7.bytecode, deployData])
    ]);
    
    console.log('Sending deployment transaction...');
    const tx = await keyManager.execute(executeCalldata, { gasLimit: 3000000 });
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    
    // Find deployed contract address from logs
    console.log('✅ Token deployed!');
    console.log('Transaction:', receipt.hash);
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Save deployment info
    const deploymentInfo = {
      name: TOKEN_NAME,
      symbol: TOKEN_SYMBOL,
      deployer: upAddress,
      txHash: receipt.hash,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('/root/.openclaw/workspace/agentpo-token.json', JSON.stringify(deploymentInfo, null, 2));
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.error(error.stack);
  }
}

deployLSP7();