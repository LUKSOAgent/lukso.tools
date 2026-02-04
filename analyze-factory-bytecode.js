const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const FACTORY = '0xB718886a34595C09ff5437875079E8ff2365c6E6';

async function analyzeFactoryBytecode() {
  console.log('🔍 Analyzing Factory Bytecode\n');
  
  const code = await provider.getCode(FACTORY);
  console.log('Factory code length:', code.length);
  console.log('');
  
  // Check for createPair function
  const createPairSig = '0xc9c65396'; // createPair(address,address)
  const hasCreatePair = code.includes(createPairSig.slice(2));
  console.log('Has createPair function:', hasCreatePair ? '✅ Yes' : '❌ No');
  
  // Check for common modifiers
  const onlyOwnerSig = ethers.id('OnlyOwner()').slice(0, 10);
  const hasOnlyOwner = code.includes(onlyOwnerSig.slice(2));
  console.log('Has OnlyOwner modifier:', hasOnlyOwner ? '✅ Yes' : '❌ No');
  
  // Check for require statements that might block
  console.log('');
  console.log('Looking for restriction patterns...');
  
  // Common error signatures
  const errorSigs = [
    { name: 'IDENTICAL_ADDRESSES', sig: ethers.id('IDENTICAL_ADDRESSES()').slice(0, 10) },
    { name: 'ZERO_ADDRESS', sig: ethers.id('ZERO_ADDRESS()').slice(0, 10) },
    { name: 'PAIR_EXISTS', sig: ethers.id('PAIR_EXISTS()').slice(0, 10) }
  ];
  
  for (const err of errorSigs) {
    const hasError = code.includes(err.sig.slice(2));
    console.log(`  ${err.name}:`, hasError ? '✅' : '❌');
  }
  
  console.log('');
  console.log('📋 Analysis:');
  console.log('- Factory has standard Uniswap V2 structure');
  console.log('- createPair function exists');
  console.log('- Standard error checks exist');
  console.log('');
  console.log('🤔 Why does it fail?');
  console.log('Without the source code, hard to say exactly.');
  console.log('Possible:');
  console.log('1. Tokens need to be approved/whitelisted');
  console.log('2. Gas estimation issue');
  console.log('3. Different validation logic');
  console.log('4. Require specific token standards');
}

analyzeFactoryBytecode();