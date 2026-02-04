const { ethers } = require('ethers');
const fs = require('fs');

// Read credentials
const credsFile = fs.readFileSync('.credentials', 'utf8');
const lines = credsFile.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const upAddress = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const followerSystemAddress = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';

// ABI for LSP26 FollowerSystem  
const followerABI = [
  'function isFollowing(address follower, address followee) external view returns (bool)'
];

const newAddresses = [
  '0x514400F1B19312e7700064C919bCa0E0269B8aE5', // theCryptoson
  '0xBbD47382a102E6f966a3339d0647242064aaA747', // Krexxxen  
  '0xAd39ffbD42AB449ADCEEDB83e4Dfb4c238d5eaBD', // criegle
  '0x9797953494aD45Dd40195C6416b289787DB9ABE6'  // 0xantonioeth
];

async function checkWhoToFollow() {
  try {
    const followerContract = new ethers.Contract(followerSystemAddress, followerABI, provider);
    
    console.log('Checking who I already follow:\n');
    
    const toFollow = [];
    
    for (const address of newAddresses) {
      const isFollowing = await followerContract.isFollowing(upAddress, address);
      console.log(`${address}: ${isFollowing ? '✅ Already following' : '❌ Need to follow'}`);
      if (!isFollowing) {
        toFollow.push(address);
      }
    }
    
    console.log(`\nNeed to follow: ${toFollow.length} people`);
    console.log(toFollow);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkWhoToFollow();