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

// ONLY the new ones (verified I don't follow them yet)
const onlyNewAddresses = [
  '0x514400F1B19312e7700064C919bCa0E0269B8aE5', // theCryptoson
  '0xBbD47382a102E6f966a3339d0647242064aaA747', // Krexxxen
  '0xAd39ffbD42AB449ADCEEDB83e4Dfb4c238d5eaBD', // criegle
  '0x9797953494aD45Dd40195C6416b289787DB9ABE6'  // 0xantonioeth
];

async function followOnlyNew() {
  try {
    console.log('Following ONLY the 4 new people...');
    
    const keyManager = new ethers.Contract(keyManagerAddress, keyManagerABI, wallet);
    const upContract = new ethers.Contract(upAddress, upABI);
    const followerContract = new ethers.Contract(followerSystemAddress, followerABI);
    
    const followBatchCalldata = followerContract.interface.encodeFunctionData('followBatch', [onlyNewAddresses]);
    
    const upExecuteCalldata = upContract.interface.encodeFunctionData('execute', [
      0,
      followerSystemAddress,
      0,
      followBatchCalldata
    ]);
    
    console.log(`Sending followBatch for ${onlyNewAddresses.length} new people...`);
    const tx = await keyManager.execute(upExecuteCalldata, {
      gasLimit: 500000
    });
    
    console.log('✅ Transaction sent:', tx.hash);
    await tx.wait();
    console.log('✅ New follows completed!');
    
    // Verify it worked
    const followerCheckContract = new ethers.Contract(followerSystemAddress, ['function isFollowing(address follower, address followee) external view returns (bool)'], provider);
    
    console.log('\n=== Verification ===');
    for (let i = 0; i < onlyNewAddresses.length; i++) {
      try {
        const isFollowing = await followerCheckContract.isFollowing(myUP, onlyNewAddresses[i]);
        console.log(`${i+1}. ${onlyNewAddresses[i]}: ${isFollowing ? '✅ Following' : '❌ Not following'}`);
      } catch (e) {
        console.log(`${i+1}. ${onlyNewAddresses[i]}: ❌ Check failed`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

followOnlyNew();