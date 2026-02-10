const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

// LSP6 permission key format
// 0x4b80742d0000000082ac0000<address>
const PERMISSIONS_PREFIX = '0x4b80742d0000000082ac0000';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  // Build permission key
  const controllerBytes = CONTROLLER.slice(2).toLowerCase();
  const permissionKey = PERMISSIONS_PREFIX + controllerBytes;
  
  console.log('Controller:', CONTROLLER);
  console.log('Permission key:', permissionKey);
  
  // Read from UP storage
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  try {
    const perms = await up.getData(permissionKey);
    console.log('Raw permissions:', perms);
    
    if (perms && perms !== '0x') {
      const permValue = BigInt(perms);
      console.log('Permission value (hex):', '0x' + permValue.toString(16));
      
      // LSP6 permission bits
      const EXECUTE = BigInt(1) << BigInt(0);        // 0x00000001
      const SETDATA = BigInt(1) << BigInt(2);        // 0x00000004
      const SUPER_SETDATA = BigInt(1) << BigInt(14); // 0x00004000
      const ALL_PERMISSIONS = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
      
      console.log('');
      console.log('Permission check:');
      console.log('- Has EXECUTE:', (permValue & EXECUTE) !== BigInt(0));
      console.log('- Has SETDATA:', (permValue & SETDATA) !== BigInt(0));
      console.log('- Has SUPER_SETDATA:', (permValue & SUPER_SETDATA) !== BigInt(0));
      console.log('- Has ALL_PERMISSIONS:', permValue === ALL_PERMISSIONS);
      
      // Check if controller is even registered
      if (permValue === BigInt(0)) {
        console.log('\n⚠️ Controller has NO permissions!');
      }
    } else {
      console.log('No permissions found - controller not registered?');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

check();
