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

// Working pattern from yesterday: KeyManager.execute(UP.execute(0, target, 0, calldata))
const keyManagerABI = ['function execute(bytes calldata payload) external payable returns (bytes memory)'];
const upABI = ['function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)'];
const followerABI = ['function follow(address profileToFollow) external'];

const toFollow = [
  '0x514400F1B19312e7700064C919bCa0E0269B8aE5', // theCryptoson
  '0xBbD47382a102E6f966a3339d0647242064aaA747', // Krexxxen
];

async function workingFollow() {
  try {
    console.log('Using the working pattern from yesterday...');
    
    const keyManager = new ethers.Contract(keyManagerAddress, keyManagerABI, wallet);
    const upContract = new ethers.Contract(upAddress, upABI);
    const followerContract = new ethers.Contract(followerSystemAddress, followerABI);
    
    for (const address of toFollow) {
      console.log(`\nFollowing ${address}...`);
      
      // Build the calldata for LSP26.follow()
      const followCalldata = followerContract.interface.encodeFunctionData('follow', [address]);
      
      // Build UP.execute(0, LSP26, 0, followCalldata) 
      const upExecuteCalldata = upContract.interface.encodeFunctionData('execute', [
        0, // CALL operation type
        followerSystemAddress, // target = LSP26
        0, // value = 0
        followCalldata // data = follow(address)
      ]);
      
      // Execute via KeyManager
      const tx = await keyManager.execute(upExecuteCalldata, {
        gasLimit: 200000
      });
      
      console.log('✅ Transaction sent:', tx.hash);
      await tx.wait();
      console.log('✅ Confirmed!');
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

workingFollow();