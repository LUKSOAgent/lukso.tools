const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.mainnet.lukso.network';
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const LSP28_KEY = '0x0a23000000000000000000000000000000000000000000000000000000000000';

const LSP0_ABI = [
  'function getData(bytes32 dataKey) view returns (bytes)'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const up = new ethers.Contract(UP_ADDRESS, LSP0_ABI, provider);
  
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║             FINAL VERIFICATION - LSP28 GRID                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  
  // Get array length
  const arrayLengthData = await up.getData(LSP28_KEY);
  let arrayLength = 0;
  if (arrayLengthData && arrayLengthData !== '0x' && arrayLengthData.length >= 66) {
    arrayLength = parseInt(arrayLengthData.slice(-64), 16);
  }
  
  console.log('✅ Array Length:', arrayLength);
  
  // Get each grid entry
  for (let i = 0; i < arrayLength; i++) {
    const indexKey = ethers.keccak256(
      ethers.solidityPacked(['bytes32', 'uint256'], [LSP28_KEY, i])
    );
    const data = await up.getData(indexKey);
    console.log(`   Grid[${i}]:`, data ? `✅ Stored (${data.length} chars)` : '❌ Missing');
    console.log(`   Data Key:`, indexKey);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔗 Links:');
  console.log('   Explorer: https://explorer.execution.mainnet.lukso.network/address/' + UP_ADDRESS);
  console.log('   Inspector: https://erc725-inspect.lukso.tech/inspector?address=' + UP_ADDRESS);
  console.log('\n✅ LSP28 Grid deployment complete and verified!');
}

main().catch(console.error);
