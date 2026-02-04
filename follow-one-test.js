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

async function testFollowOne() {
  try {
    // Test just theCryptoson first
    const testAddress = '0x514400F1B19312e7700064C919bCa0E0269B8aE5';
    
    console.log('Testing follow for theCryptoson only...');
    console.log('Address:', testAddress);
    
    // First double-check if I already follow this address
    const checkABI = ['function isFollowing(address follower, address followee) external view returns (bool)'];
    const checkContract = new ethers.Contract(followerSystemAddress, checkABI, provider);
    
    const alreadyFollowing = await checkContract.isFollowing(upAddress, testAddress);
    console.log('Already following:', alreadyFollowing ? '✅ Yes' : '❌ No');
    
    if (alreadyFollowing) {
      console.log('❌ Cannot follow - already following this address');
      return;
    }
    
    const keyManager = new ethers.Contract(keyManagerAddress, keyManagerABI, wallet);
    const upContract = new ethers.Contract(upAddress, upABI);
    const followerContract = new ethers.Contract(followerSystemAddress, followerABI);
    
    const followBatchCalldata = followerContract.interface.encodeFunctionData('followBatch', [[testAddress]]);
    
    const upExecuteCalldata = upContract.interface.encodeFunctionData('execute', [
      0,
      followerSystemAddress,
      0,
      followBatchCalldata
    ]);
    
    console.log('Sending follow transaction...');
    const tx = await keyManager.execute(upExecuteCalldata, {
      gasLimit: 300000
    });
    
    console.log('✅ Transaction sent:', tx.hash);
    await tx.wait();
    console.log('✅ Follow successful!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFollowOne();