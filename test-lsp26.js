const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const followerSystemAddress = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';
const myUP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

const followerABI = [
  'function isFollowing(address follower, address followee) external view returns (bool)',
  'function getFollowCount(address profile) external view returns (uint256)',
  'function getFollowerCount(address profile) external view returns (uint256)'
];

async function testLSP26() {
  try {
    const followerContract = new ethers.Contract(followerSystemAddress, followerABI, provider);
    
    console.log('Testing LSP26 contract...\n');
    
    // Check my follow count
    const myFollowCount = await followerContract.getFollowCount(myUP);
    console.log('My follow count:', myFollowCount.toString());
    
    // Check my follower count  
    const myFollowerCount = await followerContract.getFollowerCount(myUP);
    console.log('My follower count:', myFollowerCount.toString());
    
    // Check if I'm following Jordy
    const followingJordy = await followerContract.isFollowing(myUP, '0x378Be8577ede94b9d4b9F45447F21B826501bab8');
    console.log('Following Jordy:', followingJordy ? '✅' : '❌');
    
    // Check if I'm following shell (from successful tx)
    const followingShell = await followerContract.isFollowing(myUP, '0x5bA145ebB07e603328285A04589da2a7A202fCED');
    console.log('Following shell:', followingShell ? '✅' : '❌');
    
    console.log('\nLSP26 contract is responsive! ✅');
    
  } catch (error) {
    console.error('❌ LSP26 Error:', error.message);
  }
}

testLSP26();