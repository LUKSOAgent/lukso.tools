const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const followerSystemAddress = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';
const myUP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

const followerABI = ['function isFollowing(address follower, address followee) external view returns (bool)'];

// Known addresses from yesterday
const knownAddresses = {
  'Jordy': '0x378Be8577ede94b9d4b9F45447F21B826501bab8',
  'shell_lyx': '0x5bA145ebB07e603328285A04589da2a7A202fCED',
  'ToddKellgren': '0x041B2744fB8433Fc8165036d30072c514390271e',
  'WOLVESOFLUKSO': '0x9cD867b956f66A45112d2047332384f348a62FA7'
};

// New addresses from today
const newAddresses = {
  'theCryptoson': '0x514400F1B19312e7700064C919bCa0E0269B8aE5',
  'Krexxxen': '0xBbD47382a102E6f966a3339d0647242064aaA747',
  'criegle': '0xAd39ffbD42AB449ADCEEDB83e4Dfb4c238d5eaBD',
  '0xantonioeth': '0x9797953494aD45Dd40195C6416b289787DB9ABE6'
};

async function checkCurrentFollows() {
  const contract = new ethers.Contract(followerSystemAddress, followerABI, provider);
  
  console.log('=== WHO AM I CURRENTLY FOLLOWING? ===\n');
  
  console.log('Known follows from yesterday:');
  for (const [name, address] of Object.entries(knownAddresses)) {
    try {
      const isFollowing = await contract.isFollowing(myUP, address);
      console.log(`  ${name}: ${isFollowing ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`  ${name}: ❌ Error`);
    }
  }
  
  console.log('\nNew addresses to check:');
  for (const [name, address] of Object.entries(newAddresses)) {
    try {
      const isFollowing = await contract.isFollowing(myUP, address);
      console.log(`  ${name}: ${isFollowing ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`  ${name}: ❌ Error`);
    }
  }
}

checkCurrentFollows();