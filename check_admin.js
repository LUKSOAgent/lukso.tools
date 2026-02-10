const { ethers } = require('ethers');

const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const POSSIBLE_ADMIN = '0xD6ebB3C5C1836f5377d134c303f4EBb053562f6f';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const kmAbi = [
    'function getData(bytes32 dataKey) external view returns (bytes memory)',
    'function getNonce(address _address, uint256 _channel) external view returns (uint256)'
  ];
  const km = new ethers.Contract(KEY_MANAGER, kmAbi, provider);
  
  console.log('Checking address:', POSSIBLE_ADMIN);
  console.log('');
  
  // Check permissions
  const permKey = '0x4b80742d0000000082ac0000' + POSSIBLE_ADMIN.slice(2).toLowerCase();
  try {
    const perms = await km.getData(permKey);
    console.log('Permissions:', perms);
    if (perms && perms !== '0x' && perms.length >= 66) {
      const val = BigInt(perms);
      console.log('Has ALL permissions:', val === BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'));
    }
  } catch (e) {
    console.log('getData failed:', e.message);
  }
  
  // Check nonce
  try {
    const nonce = await km.getNonce(POSSIBLE_ADMIN, 0);
    console.log('✅ Registered controller, nonce:', nonce.toString());
  } catch (e) {
    console.log('❌ Not registered');
  }
}

check();
