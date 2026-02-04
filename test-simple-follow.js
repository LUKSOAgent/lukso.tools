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

const keyManagerABI = ['function execute(bytes calldata payload) external payable returns (bytes memory)'];
const upABI = ['function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)'];
const followerABI = ['function followBatch(address[] calldata profilesToFollow) external'];

async function testSimpleFollow() {
  try {
    console.log('Testing LSP26 with one known good address (shell_lyx)...');
    
    const keyManager = new ethers.Contract(keyManagerAddress, keyManagerABI, wallet);
    const upContract = new ethers.Contract(upAddress, upABI);
    const followerContract = new ethers.Contract(followerSystemAddress, followerABI);
    
    // Try to follow shell again (should be idempotent or error gracefully)
    const testAddress = '0x5bA145ebB07e603328285A04589da2a7A202fCED'; // shell_lyx
    
    const followBatchCalldata = followerContract.interface.encodeFunctionData('followBatch', [[testAddress]]);
    
    const upExecuteCalldata = upContract.interface.encodeFunctionData('execute', [
      0,
      followerSystemAddress,
      0,
      followBatchCalldata
    ]);
    
    console.log('Sending test follow...');
    const tx = await keyManager.execute(upExecuteCalldata, {
      gasLimit: 300000
    });
    
    console.log('✅ Test transaction sent:', tx.hash);
    await tx.wait();
    console.log('✅ Test successful! LSP26 works.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nLSP26 contract might be down or changed.');
  }
}

testSimpleFollow();