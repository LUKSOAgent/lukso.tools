const { ethers } = require('ethers');
const fs = require('fs');

// Read credentials
const credsFile = fs.readFileSync('.credentials', 'utf8');
const lines = credsFile.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const keyManagerAddress = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const followerSystemAddress = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';

const keyManagerABI = ['function execute(bytes calldata payload) external payable returns (bytes memory)'];
const followerABI = ['function follow(address profileToFollow) external'];

const newFollows = [
  { address: '0x514400F1B19312e7700064C919bCa0E0269B8aE5', name: 'theCryptoson' },
  { address: '0xBbD47382a102E6f966a3339d0647242064aaA747', name: 'Krexxxen' },
  { address: '0xAd39ffbD42AB449ADCEEDB83e4Dfb4c238d5eaBD', name: 'criegle' },
  { address: '0x9797953494aD45Dd40195C6416b289787DB9ABE6', name: '0xantonioeth' }
];

async function justFollow() {
  const keyManager = new ethers.Contract(keyManagerAddress, keyManagerABI, wallet);
  const followerContract = new ethers.Contract(followerSystemAddress, followerABI);
  
  for (const person of newFollows) {
    try {
      console.log(`Following ${person.name}...`);
      
      const followCalldata = followerContract.interface.encodeFunctionData('follow', [person.address]);
      
      const followExecute = ethers.concat([
        '0x00000001', // CALL
        ethers.zeroPadValue(followerSystemAddress, 32),
        ethers.zeroPadValue('0x00', 32), // value = 0
        ethers.AbiCoder.defaultAbiCoder().encode(['bytes'], [followCalldata])
      ]);
      
      const tx = await keyManager.execute(followExecute, { gasLimit: 300000 });
      console.log(`✅ ${person.name} followed! Tx: ${tx.hash}`);
      await tx.wait();
      
    } catch (error) {
      console.error(`❌ Failed to follow ${person.name}:`, error.message);
    }
  }
  
  console.log('\n✅ All follows completed!');
}

justFollow();