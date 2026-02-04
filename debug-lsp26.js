const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const followerSystemAddress = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';
const myUP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

// Try different function signatures to see what works
const testABI = [
  'function owner() external view returns (address)',
  'function paused() external view returns (bool)',
  'function isFollowing(address follower, address followee) external view returns (bool)',
  'function getFollowCount(address profile) external view returns (uint256)',
  'function getFollowerCount(address profile) external view returns (uint256)',
  'function version() external view returns (string)',
  'function supportsInterface(bytes4 interfaceId) external view returns (bool)'
];

async function debugLSP26() {
  const contract = new ethers.Contract(followerSystemAddress, testABI, provider);
  
  console.log('Testing LSP26 contract functions...\n');
  
  // Test basic functions one by one
  const tests = [
    { name: 'supportsInterface(0x01ffc9a7)', call: () => contract.supportsInterface('0x01ffc9a7') },
    { name: 'owner()', call: () => contract.owner() },
    { name: 'paused()', call: () => contract.paused() },
    { name: 'version()', call: () => contract.version() },
    { name: 'getFollowCount(myUP)', call: () => contract.getFollowCount(myUP) },
    { name: 'getFollowerCount(myUP)', call: () => contract.getFollowerCount(myUP) },
    { name: 'isFollowing(me, jordy)', call: () => contract.isFollowing(myUP, '0x378Be8577ede94b9d4b9F45447F21B826501bab8') },
  ];
  
  for (const test of tests) {
    try {
      const result = await test.call();
      console.log(`✅ ${test.name}: ${result}`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message.split('(')[0]}`);
    }
  }
  
  console.log('\n=== Contract Code Check ===');
  try {
    const code = await provider.getCode(followerSystemAddress);
    console.log('Has code:', code !== '0x' ? '✅ Yes' : '❌ No');
    console.log('Code length:', code.length);
  } catch (error) {
    console.log('❌ Code check failed:', error.message);
  }
}

debugLSP26();