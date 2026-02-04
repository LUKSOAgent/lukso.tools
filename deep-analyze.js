const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const ADDRESS = '0x05ce285A8ac77710AAfDcbD1B26Cf6af3bD1afAb';

async function deepAnalyze() {
  console.log('🔍 Deep Analysis of Example Pool\n');
  
  const code = await provider.getCode(ADDRESS);
  
  // Extended signature check
  const signatures = {
    // V2
    'V2: token0()': '0x0dfe1681',
    'V2: token1()': '0xd21220a7',
    'V2: getReserves()': '0x0902f1ac',
    'V2: factory()': '0xc45a0155',
    'V2: mint(address)': '0x6a627842',
    'V2: burn(address)': '0x89afcb44',
    'V2: swap(uint256,uint256,address,bytes)': '0x022c0d9f',
    
    // V3
    'V3: slot0()': '0x3850c7bd',
    'V3: liquidity()': '0x1a686502',
    'V3: positions(bytes32)': '0x514ea4bf',
    
    // Custom/Other
    'balanceOf(address)': '0x70a08231',
    'transfer(address,uint256)': '0xa9059cbb',
    'transferFrom(address,address,uint256)': '0x23b872dd',
    'approve(address,uint256)': '0x095ea7b3',
    'totalSupply()': '0x18160ddd',
    'decimals()': '0x313ce567',
    'symbol()': '0x95d89b41',
    'name()': '0x06fdde03'
  };
  
  console.log('Function Signatures Found:');
  for (const [name, selector] of Object.entries(signatures)) {
    const hasSig = code.includes(selector.slice(2));
    console.log(`  ${hasSig ? '✅' : '❌'} ${name}`);
  }
  
  // Try to get basic info using low-level calls
  console.log('\nTrying low-level calls:');
  
  // Try token0
  try {
    const token0Data = '0x0dfe1681';
    const result = await provider.call({ to: ADDRESS, data: token0Data });
    if (result && result !== '0x') {
      const token0 = ethers.getAddress('0x' + result.slice(26));
      console.log('  Token0:', token0);
    }
  } catch (e) {
    console.log('  Token0: Failed');
  }
  
  // Try token1
  try {
    const token1Data = '0xd21220a7';
    const result = await provider.call({ to: ADDRESS, data: token1Data });
    if (result && result !== '0x') {
      const token1 = ethers.getAddress('0x' + result.slice(26));
      console.log('  Token1:', token1);
    }
  } catch (e) {
    console.log('  Token1: Failed');
  }
  
  // Try getReserves
  try {
    const reservesData = '0x0902f1ac';
    const result = await provider.call({ to: ADDRESS, data: reservesData });
    if (result && result !== '0x') {
      // V2: (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)
      const reserve0 = BigInt('0x' + result.slice(2, 26).padStart(24, '0'));
      const reserve1 = BigInt('0x' + result.slice(26, 50).padStart(24, '0'));
      console.log('  Reserve0:', ethers.formatEther(reserve0));
      console.log('  Reserve1:', ethers.formatEther(reserve1));
    }
  } catch (e) {
    console.log('  getReserves: Failed');
  }
  
  console.log('');
  console.log('Explorer link:');
  console.log('https://explorer.execution.mainnet.lukso.network/address/' + ADDRESS);
}

deepAnalyze().catch(console.error);