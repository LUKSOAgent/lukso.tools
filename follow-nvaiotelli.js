const { ethers } = require('ethers');
const fs = require('fs');

// Read credentials
const credsFile = fs.readFileSync('.credentials', 'utf8');
const lines = credsFile.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const keyManagerAddress = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const upAddress = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const followerSystemAddress = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';
const potatoTokenAddress = '0x80d898c5a3a0b118a0c8c8adcdbb260fc687f1ce';

const keyManagerABI = ['function execute(bytes calldata payload) external payable returns (bytes memory)'];
const upABI = ['function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)'];
const followerABI = ['function followBatch(address[] calldata profilesToFollow) external'];
const lsp7ABI = ['function transfer(address from, address to, uint256 amount, bool force, bytes calldata data) external'];

const nvaiotelli = '0xec50F4Bc0631BFbf43EF3D7409639e0ecf84Db1E';

async function followNvaiotelli() {
  try {
    const keyManager = new ethers.Contract(keyManagerAddress, keyManagerABI, wallet);
    const upContract = new ethers.Contract(upAddress, upABI);
    
    console.log('Following nvaiotelli...');
    
    // Step 1: Follow
    const followerContract = new ethers.Contract(followerSystemAddress, followerABI);
    const followCalldata = followerContract.interface.encodeFunctionData('followBatch', [[nvaiotelli]]);
    
    const followExecute = upContract.interface.encodeFunctionData('execute', [
      0, followerSystemAddress, 0, followCalldata
    ]);
    
    const followTx = await keyManager.execute(followExecute, { gasLimit: 300000 });
    console.log('✅ Follow tx:', followTx.hash);
    await followTx.wait();
    console.log('✅ Follow confirmed!');
    
    // Step 2: Send potato
    console.log('Sending potato...');
    const potatoContract = new ethers.Contract(potatoTokenAddress, lsp7ABI);
    const potatoCalldata = potatoContract.interface.encodeFunctionData('transfer', [
      upAddress, nvaiotelli, ethers.parseEther('1'), true, '0x'
    ]);
    
    const potatoExecute = upContract.interface.encodeFunctionData('execute', [
      0, potatoTokenAddress, 0, potatoCalldata
    ]);
    
    const potatoTx = await keyManager.execute(potatoExecute, { gasLimit: 300000 });
    console.log('✅ Potato tx:', potatoTx.hash);
    await potatoTx.wait();
    console.log('✅ Potato confirmed!');
    
    console.log('\n🎉 nvaiotelli fully processed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

followNvaiotelli();