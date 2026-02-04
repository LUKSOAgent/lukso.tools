const { ethers } = require('ethers');
const fs = require('fs');
const LSP7Mintable = require('@lukso/lsp-smart-contracts/artifacts/LSP7Mintable.json');

const credsFile = fs.readFileSync('.credentials', 'utf8');
const lines = credsFile.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const keyManagerAddress = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const upAddress = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const jordyUP = '0x378Be8577ede94b9d4b9F45447F21B826501bab8';
const tokenAddress = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';

// Mint amounts
const MINT_TO_SELF = ethers.parseEther('400000'); // 40%
const MINT_TO_JORDY = ethers.parseEther('400000'); // 40%
const TOTAL_MINTED = ethers.parseEther('800000');

async function mintTokens() {
  try {
    console.log('🪙 Minting AGENTPO Tokens...\n');
    console.log('Token:', tokenAddress);
    console.log('Minting to self:', ethers.formatEther(MINT_TO_SELF), 'AGENTPO');
    console.log('Minting to Jordy:', ethers.formatEther(MINT_TO_JORDY), 'AGENTPO');
    console.log('Total:', ethers.formatEther(TOTAL_MINTED), 'AGENTPO');
    console.log('');
    
    const keyManager = new ethers.Contract(keyManagerAddress, [
      'function execute(bytes calldata payload) external payable returns (bytes memory)'
    ], wallet);
    
    const upContract = new ethers.Contract(upAddress, [
      'function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)'
    ]);
    
    const tokenContract = new ethers.Contract(tokenAddress, LSP7Mintable.abi);
    
    // Mint to self
    console.log('1. Minting to myself...');
    const mintSelfCalldata = tokenContract.interface.encodeFunctionData('mint', [
      upAddress,
      MINT_TO_SELF,
      true, // force
      '0x' // data
    ]);
    
    const executeSelf = upContract.interface.encodeFunctionData('execute', [
      0, // CALL
      tokenAddress,
      0,
      mintSelfCalldata
    ]);
    
    const tx1 = await keyManager.execute(executeSelf, { gasLimit: 300000 });
    await tx1.wait();
    console.log('✅ Minted to self:', tx1.hash);
    
    // Mint to Jordy
    console.log('2. Minting to Jordy...');
    const mintJordyCalldata = tokenContract.interface.encodeFunctionData('mint', [
      jordyUP,
      MINT_TO_JORDY,
      true, // force
      '0x' // data
    ]);
    
    const executeJordy = upContract.interface.encodeFunctionData('execute', [
      0, // CALL
      tokenAddress,
      0,
      mintJordyCalldata
    ]);
    
    const tx2 = await keyManager.execute(executeJordy, { gasLimit: 300000 });
    await tx2.wait();
    console.log('✅ Minted to Jordy:', tx2.hash);
    
    console.log('\n🎉 All tokens minted!');
    console.log('Total supply:', ethers.formatEther(TOTAL_MINTED), 'AGENTPO');
    
    // Save minting info
    const mintInfo = {
      token: tokenAddress,
      minted: {
        self: { address: upAddress, amount: MINT_TO_SELF.toString() },
        jordy: { address: jordyUP, amount: MINT_TO_JORDY.toString() }
      },
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync('/root/.openclaw/workspace/agentpo-minted.json', JSON.stringify(mintInfo, null, 2));
    
  } catch (error) {
    console.error('❌ Minting failed:', error.message);
  }
}

mintTokens();