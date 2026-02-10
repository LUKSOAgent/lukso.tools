const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const upAbi = ['function owner() external view returns (address)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  try {
    const owner = await up.owner();
    console.log('UP Owner:', owner);
    console.log('KeyManager:', KEY_MANAGER);
    console.log('Match:', owner.toLowerCase() === KEY_MANAGER.toLowerCase());
    
    if (owner.toLowerCase() === KEY_MANAGER.toLowerCase()) {
      console.log('\n✅ KeyManager is the owner of the UP');
      console.log('But my controller has no permissions on the KeyManager');
      
      // Check if I can find who has permissions on the KeyManager
      console.log('\nI need to find an address that has admin permissions on the KeyManager');
      console.log('to grant permissions to my controller (0xE093...86a)');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

check();
