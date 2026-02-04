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

const remaining = [
  { name: 'Krexxxen', address: '0xBbD47382a102E6f966a3339d0647242064aaA747' },
  { name: 'criegle', address: '0xAd39ffbD42AB449ADCEEDB83e4Dfb4c238d5eaBD' },
  { name: '0xantonioeth', address: '0x9797953494aD45Dd40195C6416b289787DB9ABE6' }
];

async function followRemaining() {
  const keyManager = new ethers.Contract(keyManagerAddress, keyManagerABI, wallet);
  const upContract = new ethers.Contract(upAddress, upABI);
  const followerContract = new ethers.Contract(followerSystemAddress, followerABI);
  
  for (const person of remaining) {
    try {
      console.log(`\nFollowing ${person.name}...`);
      
      const followBatchCalldata = followerContract.interface.encodeFunctionData('followBatch', [[person.address]]);
      
      const upExecuteCalldata = upContract.interface.encodeFunctionData('execute', [
        0,
        followerSystemAddress,
        0,
        followBatchCalldata
      ]);
      
      const tx = await keyManager.execute(upExecuteCalldata, {
        gasLimit: 300000
      });
      
      console.log(`✅ ${person.name} follow sent:`, tx.hash);
      await tx.wait();
      console.log(`✅ ${person.name} confirmed!`);
      
      // Small delay between follows
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`❌ ${person.name} failed:`, error.message);
    }
  }
  
  console.log('\n🎉 All remaining follows completed!');
}

followRemaining();