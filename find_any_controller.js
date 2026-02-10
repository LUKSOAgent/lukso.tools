const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  // Check UP storage for AddressPermissions
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  // Array length key for AddressPermissions[]
  const arrayLengthKey = '0xdf30dba06db6a30e65354d9a64c529861dced349000000000000000000000000';
  
  try {
    const length = await up.getData(arrayLengthKey);
    console.log('Number of controllers:', length);
    
    if (length && length !== '0x') {
      const num = parseInt(length.slice(2), 16);
      console.log('Found', num, 'controllers');
      
      // Get first controller
      if (num > 0) {
        const indexKey = '0xdf30dba06db6a30e65354d9a64c529861dced349000000000000000000000000';
        // Actually need to compute the key differently for array elements
        // Try direct index 0
        const key0 = '0xdf30dba06db6a30e65354d9a64c529861dced349000000000000000000000000';
        const addr0 = await up.getData(key0);
        console.log('Controller 0:', addr0);
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
  
  // Alternative: check KeyManager directly for target
  const kmAbi = ['function target() external view returns (address)'];
  try {
    const km = new ethers.Contract(KEY_MANAGER, kmAbi, provider);
    const target = await km.target();
    console.log('KeyManager target:', target);
  } catch (e) {
    console.log('target() not available');
  }
}

check();
