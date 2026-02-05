const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TARGET_CONTRACT = '0x4f95606AA863ba1FDfd4E14d6050BDe4fA38B058';
const FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';
const COLLECTION_ADDRESS = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';

async function checkTargetContract() {
  console.log('🔍 Checking Target Contract\n');
  console.log('Address:', TARGET_CONTRACT);
  console.log('');
  
  // Check if it's a proxy
  const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
  const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
  
  const implementation = await provider.getStorage(TARGET_CONTRACT, IMPLEMENTATION_SLOT);
  const admin = await provider.getStorage(TARGET_CONTRACT, ADMIN_SLOT);
  
  console.log('Proxy Check:');
  console.log('  Implementation slot:', implementation);
  console.log('  Admin slot:', admin);
  
  const implAddress = '0x' + implementation.slice(-40);
  const adminAddress = '0x' + admin.slice(-40);
  
  if (implementation !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
    console.log('  Implementation address:', implAddress);
    console.log('  This IS an ERC1967 proxy!');
    
    // Get implementation code
    const implCode = await provider.getCode(implAddress);
    console.log('  Implementation code size:', implCode.length / 2 - 1, 'bytes');
  } else {
    console.log('  This is NOT a proxy (or uses different pattern)');
  }
  console.log('');
  
  // Try to detect if it's a UP
  const UP_ABI = [
    'function owner() view returns (address)',
    'function getData(bytes32 dataKey) view returns (bytes)',
    'function getDataBatch(bytes32[] dataKeys) view returns (bytes[])',
    'function supportsInterface(bytes4 interfaceId) view returns (bool)'
  ];
  
  const contract = new ethers.Contract(TARGET_CONTRACT, UP_ABI, provider);
  
  // Check if it supports LSP0 interface
  const LSP0_INTERFACE_ID = '0x24871b3a';
  try {
    const supportsLSP0 = await contract.supportsInterface(LSP0_INTERFACE_ID);
    console.log('Supports LSP0 (ERC725Account):', supportsLSP0);
  } catch (e) {
    console.log('Could not check interface support');
  }
  
  // Try to get owner
  try {
    const owner = await contract.owner();
    console.log('Owner:', owner);
  } catch (e) {
    console.log('No owner() function (not a UP)');
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('Comparing with our Collection:');
  console.log('═══════════════════════════════════════════════════');
  console.log('Our Collection:', COLLECTION_ADDRESS);
  console.log('Target Contract:', TARGET_CONTRACT);
  console.log('Are they the same?:', COLLECTION_ADDRESS.toLowerCase() === TARGET_CONTRACT.toLowerCase());
  console.log('');
  
  // Check if our collection is a proxy too
  const ourImpl = await provider.getStorage(COLLECTION_ADDRESS, IMPLEMENTATION_SLOT);
  console.log('Our Collection Implementation slot:', ourImpl.slice(0, 30) + '...');
  if (ourImpl !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
    console.log('Our collection IS a proxy!');
    console.log('Implementation:', '0x' + ourImpl.slice(-40));
  }
}

checkTargetContract().catch(console.error);