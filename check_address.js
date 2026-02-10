const { ethers } = require('ethers');

const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CHECK_ADDRESS = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const kmAbi = [
    'function getData(bytes32 dataKey) external view returns (bytes memory)',
    'function getNonce(address _address, uint256 _channel) external view returns (uint256)'
  ];
  const km = new ethers.Contract(KEY_MANAGER, kmAbi, provider);
  
  console.log('Checking address:', CHECK_ADDRESS);
  console.log('');
  
  // Check permissions
  const permKey = '0x4b80742d0000000082ac0000' + CHECK_ADDRESS.slice(2).toLowerCase();
  try {
    const perms = await km.getData(permKey);
    console.log('Permissions:', perms);
    if (perms && perms !== '0x' && perms.length >= 66) {
      const val = BigInt(perms);
      console.log('✅ HAS PERMISSIONS:', '0x' + val.toString(16));
      console.log('Has ALL:', val === BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'));
    }
  } catch (e) {
    console.log('❌ getData reverted:', e.message);
  }
  
  // Check nonce
  try {
    const nonce = await km.getNonce(CHECK_ADDRESS, 0);
    console.log('✅ Registered, nonce:', nonce.toString());
  } catch (e) {
    console.log('❌ Not registered');
  }
}

check();
