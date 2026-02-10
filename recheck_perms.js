const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  // Check the UP's data directly (not KeyManager)
  // LSP6 stores permissions in the UP's ERC725Y storage
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  console.log('Checking UP directly:', MY_UP);
  console.log('Controller:', CONTROLLER);
  console.log('');
  
  // LSP6 permission key format in UP storage:
  // AddressPermissions:Permissions:<address>
  // = 0x4b80742d0000000082ac0000<address>
  const permKey = '0x4b80742d0000000082ac0000' + CONTROLLER.slice(2).toLowerCase();
  console.log('Permission key:', permKey);
  
  try {
    const perms = await up.getData(permKey);
    console.log('Permissions from UP:', perms);
    
    if (perms && perms !== '0x' && perms.length >= 66) {
      const val = BigInt(perms);
      console.log('✅ HAS PERMISSIONS:', '0x' + val.toString(16));
      
      // LSP6 permission bits
      console.log('EXECUTE:', (val & BigInt(1)) !== BigInt(0));
      console.log('SETDATA:', (val & BigInt(4)) !== BigInt(0));
      console.log('SUPER_SETDATA:', (val & BigInt(16384)) !== BigInt(0));
      console.log('ADDLSP1DELEGATE:', (val & BigInt(524288)) !== BigInt(0));
      console.log('ALL_PERMISSIONS:', val === BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'));
    } else {
      console.log('❌ No permissions found');
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

check();
