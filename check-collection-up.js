const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const COLLECTION_UP = '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4';
const CLAIMED_KM = '0x3B0492fF46B7A4Dc48Aeb2Eb0595a11FD530d125';

// LSP6 KeyManager data key
const LSP6KEYMANAGER_KEY = '0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbdf6277f3cc0730c45b828b6db8b47';

const UP_ABI = [
  'function getData(bytes32 dataKey) view returns (bytes)',
  'function owner() view returns (address)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)'
];

async function checkCollectionUP() {
  console.log('🔍 Checking Collection UP Directly\n');
  
  const up = new ethers.Contract(COLLECTION_UP, UP_ABI, provider);
  
  console.log('Collection UP:', COLLECTION_UP);
  console.log('');
  
  // Get KeyManager address from UP storage
  try {
    const kmAddress = await up.getData(LSP6KEYMANAGER_KEY);
    console.log('LSP6KeyManager from UP data:', kmAddress);
    
    if (kmAddress && kmAddress.length >= 42) {
      const actualKM = '0x' + kmAddress.slice(-40);
      console.log('Actual KeyManager:', actualKM);
      console.log('Matches claimed KM:', actualKM.toLowerCase() === CLAIMED_KM.toLowerCase());
      console.log('');
    }
  } catch (e) {
    console.log('Could not get KeyManager data:', e.message);
    console.log('');
  }
  
  // Check owner
  try {
    const owner = await up.owner();
    console.log('Collection UP Owner:', owner);
    console.log('Is self-owned?:', owner.toLowerCase() === COLLECTION_UP.toLowerCase());
    console.log('');
  } catch (e) {
    console.log('Could not get owner:', e.message);
    console.log('');
  }
  
  // Check if it's a UP
  try {
    const LSP0_INTERFACE = '0x24871b3a';
    const isUP = await up.supportsInterface(LSP0_INTERFACE);
    console.log('Supports LSP0 (is UP):', isUP);
    console.log('');
  } catch (e) {
    console.log('Could not check interface:', e.message);
    console.log('');
  }
  
  // Check code
  const code = await provider.getCode(COLLECTION_UP);
  console.log('Collection UP code size:', code.length / 2 - 1, 'bytes');
  console.log('Is contract:', code.length > 2);
  console.log('');
  
  console.log('═══════════════════════════════════════════════════');
  console.log('KeyManager Check:');
  console.log('═══════════════════════════════════════════════════');
  
  const kmCode = await provider.getCode(CLAIMED_KM);
  console.log('Claimed KM code size:', kmCode.length / 2 - 1, 'bytes');
  console.log('Is contract:', kmCode.length > 2);
  console.log('');
  
  if (kmCode.length > 2) {
    // Try a simple static call
    const KM_ABI = ['function target() view returns (address)'];
    const km = new ethers.Contract(CLAIMED_KM, KM_ABI, provider);
    
    try {
      const target = await km.target();
      console.log('KM Target:', target);
      console.log('Matches Collection UP:', target.toLowerCase() === COLLECTION_UP.toLowerCase());
    } catch (e) {
      console.log('Could not call target():', e.message.slice(0, 100));
      
      // The KM might not be initialized yet
      console.log('');
      console.log('⚠️ The KeyManager might not be initialized');
      console.log('   or the UP might not have set it as the KeyManager');
    }
  }
}

checkCollectionUP().catch(console.error);