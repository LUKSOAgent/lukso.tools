const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

// Common LSP3 profile keys
const KEYS = {
  LSP3Profile: ethers.keccak256(ethers.toUtf8Bytes('LSP3Profile')),
  LSP3SupportedStandards: '0xeafec4d89fa9619883b50089e99d5c5d6e8e09f',
  LSP12IssuedAssets: ethers.keccak256(ethers.toUtf8Bytes('LSP12IssuedAssets[]')),
  LSP5ReceivedAssets: ethers.keccak256(ethers.toUtf8Bytes('LSP5ReceivedAssets[]')),
  LSP1UniversalReceiverDelegate: ethers.keccak256(ethers.toUtf8Bytes('LSP1UniversalReceiverDelegate')),
};

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  console.log('=== CHECKING PROFILE KEYS ===\n');
  
  for (const [name, key] of Object.entries(KEYS)) {
    const data = await up.getData(key);
    console.log(`${name}:`);
    console.log(`  Key: ${key.slice(0, 30)}...`);
    console.log(`  Has data: ${data.length > 2 ? 'YES' : 'NO'}`);
    if (data.length > 2) {
      console.log(`  Data length: ${data.length}`);
    }
    console.log('');
  }
}

check();
