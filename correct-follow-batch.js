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

// CORRECT pattern from yesterday: use followBatch()
const keyManagerABI = ['function execute(bytes calldata payload) external payable returns (bytes memory)'];
const upABI = ['function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)'];
const followerABI = ['function followBatch(address[] calldata profilesToFollow) external'];

const toFollowBatch = [
  '0x514400F1B19312e7700064C919bCa0E0269B8aE5', // theCryptoson
  '0xBbD47382a102E6f966a3339d0647242064aaA747', // Krexxxen
  '0xAd39ffbD42AB449ADCEEDB83e4Dfb4c238d5eaBD', // criegle
  '0x9797953494aD45Dd40195C6416b289787DB9ABE6'  // 0xantonioeth
];

async function correctFollowBatch() {
  try {
    console.log('Using followBatch() - the working method from yesterday...');
    
    const keyManager = new ethers.Contract(keyManagerAddress, keyManagerABI, wallet);
    const upContract = new ethers.Contract(upAddress, upABI);
    const followerContract = new ethers.Contract(followerSystemAddress, followerABI);
    
    // Build followBatch(address[]) calldata
    const followBatchCalldata = followerContract.interface.encodeFunctionData('followBatch', [toFollowBatch]);
    console.log('FollowBatch calldata:', followBatchCalldata);
    
    // Build UP.execute(0, LSP26, 0, followBatchCalldata)
    const upExecuteCalldata = upContract.interface.encodeFunctionData('execute', [
      0, // CALL operation type
      followerSystemAddress, // target = LSP26
      0, // value = 0
      followBatchCalldata // data = followBatch(addresses)
    ]);
    console.log('UP execute calldata length:', upExecuteCalldata.length);
    
    // Execute via KeyManager
    console.log(`\nFollowing batch of ${toFollowBatch.length} people...`);
    const tx = await keyManager.execute(upExecuteCalldata, {
      gasLimit: 500000
    });
    
    console.log('✅ Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');
    await tx.wait();
    console.log('✅ Batch follow completed!');
    
    // List who we followed
    console.log('\n✅ Successfully followed:');
    toFollowBatch.forEach((addr, i) => {
      console.log(`  ${i+1}. ${addr}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

correctFollowBatch();