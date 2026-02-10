const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  // LSP6 KeyManager ABI with getData
  const keyManagerAbi = [
    'function getData(bytes32 dataKey) external view returns (bytes memory)',
    'function getNonce(address _address, uint256 _channel) external view returns (uint256)'
  ];
  
  const km = new ethers.Contract(KEY_MANAGER, keyManagerAbi, provider);
  
  console.log('Checking permissions for controller:', CONTROLLER);
  console.log('KeyManager:', KEY_MANAGER);
  console.log('');
  
  // Try to get nonce - this will work if address is a controller
  try {
    const nonce = await km.getNonce(CONTROLLER, 0);
    console.log('✅ Controller registered! Nonce:', nonce.toString());
  } catch (e) {
    console.log('❌ getNonce failed:', e.message);
  }
  
  // Check permission using correct LSP6 format
  // AddressPermissions:Permissions:<address>
  // Key = 0x4b80742d0000000082ac0000 + address (20 bytes)
  const permKey = '0x4b80742d0000000082ac0000' + CONTROLLER.slice(2).toLowerCase();
  console.log('\nPermission key:', permKey);
  
  try {
    const perms = await km.getData(permKey);
    console.log('Permissions data:', perms);
    
    if (perms && perms !== '0x' && perms.length >= 66) {
      const val = BigInt(perms);
      console.log('Permission value:', '0x' + val.toString(16));
      console.log('Has EXECUTE:', (val & BigInt(1)) !== BigInt(0));
      console.log('Has SETDATA:', (val & BigInt(4)) !== BigInt(0));
    } else {
      console.log('No permissions found');
    }
  } catch (e) {
    console.log('getData failed:', e.message);
  }
}

check();
