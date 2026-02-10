const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

// AddressPermissions[] array length key
// keccak256('AddressPermissions[]') = 0xdf30dba06db6a30e65354d9a64c529861dced349... (20 bytes)
// Full key = 0xdf30dba06db6a30e65354d9a64c529861dced349000000000000000000000000
const ARRAY_LENGTH_KEY = '0xdf30dba06db6a30e65354d9a64c529861dced349000000000000000000000000';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  try {
    // Check how many controllers
    const arrayLength = await up.getData(ARRAY_LENGTH_KEY);
    console.log('Array length raw:', arrayLength);
    
    if (arrayLength && arrayLength !== '0x') {
      const numControllers = parseInt(arrayLength.slice(2), 16);
      console.log('Number of controllers:', numControllers);
      
      // Check first few controllers
      for (let i = 0; i < Math.min(numControllers, 3); i++) {
        // Key: 0xdf30dba06db6a30e65354d9a64c529861dced349<index as uint128>
        const indexHex = i.toString(16).padStart(32, '0');
        const indexKey = '0xdf30dba06db6a30e65354d9a64c529861dced349' + indexHex;
        const controller = await up.getData(indexKey);
        console.log(`Controller ${i}:`, controller);
      }
    } else {
      console.log('No controllers found');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

check();
