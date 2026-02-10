const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

// Expected addresses from previous run
const EXPECTED_UP = '0x2AB4ca0274D33cc976A5eB51241AFCaEa13b5692';
const EXPECTED_KM = '0x27BcDf78e05e2381932DaE76a036EA3466e8d5A7';

async function check() {
  console.log('Checking if UP exists at:', EXPECTED_UP);
  
  const upCode = await provider.getCode(EXPECTED_UP);
  if (upCode && upCode !== '0x') {
    console.log('✅ UP exists! Code size:', upCode.length);
    
    // Check if it's a proxy
    const UP_ABI = ["function owner() view returns (address)"];
    const up = new ethers.Contract(EXPECTED_UP, UP_ABI, provider);
    try {
      const owner = await up.owner();
      console.log('Owner:', owner);
    } catch (e) {
      console.log('Could not get owner:', e.message);
    }
  } else {
    console.log('❌ No UP at this address');
  }
  
  console.log('\nChecking KeyManager at:', EXPECTED_KM);
  const kmCode = await provider.getCode(EXPECTED_KM);
  if (kmCode && kmCode !== '0x') {
    console.log('✅ KeyManager exists! Code size:', kmCode.length);
  } else {
    console.log('❌ No KeyManager at this address');
  }
}

check().catch(console.error);
