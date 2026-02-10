const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  // Get actual KeyManager from UP
  const upAbi = ['function owner() external view returns (address)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  const actualKeyManager = await up.owner();
  console.log('Actual KeyManager (from UP.owner()):', actualKeyManager);
  console.log('Stored in .credentials:', '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048');
  console.log('Match:', actualKeyManager.toLowerCase() === '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048'.toLowerCase());
  console.log('');
  
  // Now check permissions on the ACTUAL KeyManager
  const kmAbi = [
    'function getData(bytes32 dataKey) external view returns (bytes memory)',
    'function getNonce(address _address, uint256 _channel) external view returns (uint256)'
  ];
  const km = new ethers.Contract(actualKeyManager, kmAbi, provider);
  
  // Try the permission key format again
  const permKey = '0x4b80742d0000000082ac0000' + CONTROLLER.slice(2).toLowerCase();
  console.log('Checking permission key:', permKey);
  
  try {
    const perms = await km.getData(permKey);
    console.log('Permissions result:', perms);
    
    if (perms && perms !== '0x' && perms.length >= 66) {
      const val = BigInt(perms);
      console.log('✅ HAS PERMISSIONS:', '0x' + val.toString(16));
    } else {
      console.log('❌ No permissions found at this key');
    }
  } catch (e) {
    console.log('❌ getData reverted:', e.message);
  }
  
  // Try getNonce
  try {
    const nonce = await km.getNonce(CONTROLLER, 0);
    console.log('✅ Controller registered, nonce:', nonce.toString());
  } catch (e) {
    console.log('❌ getNonce reverted:', e.message);
  }
}

check();
