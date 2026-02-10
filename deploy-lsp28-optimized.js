const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// LUKSO Mainnet RPC
const RPC_URL = 'https://rpc.mainnet.lukso.network';

// Contract addresses
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER_ADDRESS = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CONTROLLER_ADDRESS = '0xE093A714960da1bF297522617BfC08132b62B86a';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';

// LSP28 Grid Array key
const LSP28_GRID_ARRAY_KEY = '0x0a23000000000000000000000000000000000000000000000000000000000000';

// LSP0 and LSP6 ABIs
const LSP0_ABI = [
  'function getData(bytes32 dataKey) view returns (bytes)',
  'function setData(bytes32 dataKey, bytes memory dataValue) external',
  'function owner() view returns (address)'
];

const LSP6_ABI = [
  'function getData(bytes32 dataKey) view returns (bytes)',
  'function execute(bytes calldata payload) external payable returns (bytes memory)',
  'function getNonce(address signer, uint128 channelId) view returns (uint256)'
];

function encodeJsonUrl(hash, url) {
  // LSP2 JSONURL encoding: 
  // 0x6f357c6a (identifier) + 2 bytes verification method + 4 bytes length + hash + url
  const identifier = '6f357c6a';
  const verificationMethod = '0000'; // keccak256
  const hashBytes = hash.replace('0x', '');
  const hashLength = (hashBytes.length / 2).toString(16).padStart(8, '0');
  const urlHex = Buffer.from(url, 'utf8').toString('hex');
  
  return '0x' + identifier + verificationMethod + hashLength + hashBytes + urlHex;
}

async function main() {
  console.log('🚀 LSP28 Grid Deployment (Optimized)\n');

  // Read the minified grid file
  const gridPath = path.join(__dirname, 'lsp28-grid.min.json');
  const gridData = fs.readFileSync(gridPath, 'utf8');
  
  console.log('📄 Grid data loaded (minified)');
  console.log('   Size:', gridData.length, 'bytes');

  // Step 1: Create data URL (temporary solution)
  console.log('\n📤 Creating data URL...');
  const encodedData = Buffer.from(gridData).toString('base64');
  const dataUrl = `data:application/json;base64,${encodedData}`;
  console.log('   Data URL length:', dataUrl.length);
  
  // Calculate content hash
  const contentHash = ethers.keccak256(ethers.toUtf8Bytes(gridData));
  console.log('   Content hash:', contentHash);

  // Step 2: Encode as LSP2 JSONURL
  console.log('\n🔐 Encoding LSP2 JSONURL...');
  const jsonUrlEncoded = encodeJsonUrl(contentHash, dataUrl);
  console.log('   Encoded length:', jsonUrlEncoded.length, 'chars');

  // Step 3: Connect to LUKSO
  console.log('\n🔗 Connecting to LUKSO Mainnet...');
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('   Wallet:', wallet.address);
  
  const up = new ethers.Contract(UP_ADDRESS, LSP0_ABI, provider);
  const keyManager = new ethers.Contract(KEY_MANAGER_ADDRESS, LSP6_ABI, provider);
  const keyManagerWithSigner = keyManager.connect(wallet);
  
  // Step 4: Get current array length
  console.log('\n📊 Checking current LSP28Grid[] array...');
  const arrayLengthData = await up.getData(LSP28_GRID_ARRAY_KEY);
  
  let currentLength = 0;
  if (arrayLengthData && arrayLengthData !== '0x' && arrayLengthData.length >= 66) {
    currentLength = parseInt(arrayLengthData.slice(-64), 16);
  }
  console.log('   Current array length:', currentLength);
  
  // Step 5: Encode data key for new index
  const newIndex = currentLength;
  const indexKey = ethers.keccak256(
    ethers.solidityPacked(
      ['bytes32', 'uint256'],
      [LSP28_GRID_ARRAY_KEY, newIndex]
    )
  );
  console.log('   New index:', newIndex);
  console.log('   Data key:', indexKey);
  
  // Step 6: Prepare setData call
  console.log('\n📝 Preparing transaction...');
  
  const upInterface = new ethers.Interface(LSP0_ABI);
  const setDataCalldata = upInterface.encodeFunctionData('setData', [
    indexKey,
    jsonUrlEncoded
  ]);
  
  console.log('   Calldata size:', setDataCalldata.length, 'chars');
  
  try {
    // Check gas estimate first
    console.log('\n⛽ Estimating gas...');
    const gasEstimate = await keyManagerWithSigner.execute.estimateGas(setDataCalldata);
    console.log('   Gas estimate:', gasEstimate.toString());
    
    // Execute
    console.log('\n📡 Sending transaction...');
    const tx = await keyManagerWithSigner.execute(setDataCalldata, {
      gasLimit: gasEstimate + 50000n // Add buffer
    });
    
    console.log('   Transaction hash:', tx.hash);
    console.log('   Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('   ✅ Confirmed in block', receipt.blockNumber);
    console.log('   Gas used:', receipt.gasUsed.toString());
    
    // Verify
    console.log('\n🔍 Verifying...');
    const verifyData = await up.getData(indexKey);
    console.log('   Data stored:', verifyData ? 'Yes (' + verifyData.length + ' chars)' : 'No');
    
    console.log('\n✅ SUCCESS! LSP28 Grid deployed');
    console.log('\n📋 Summary:');
    console.log('   Transaction Hash:', tx.hash);
    console.log('   Block Number:', receipt.blockNumber);
    console.log('   Explorer: https://explorer.execution.mainnet.lukso.network/tx/' + tx.hash);
    console.log('   Array Index:', newIndex);
    console.log('   Data Key:', indexKey);
    console.log('   Content Hash:', contentHash);
    
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      index: newIndex,
      dataKey: indexKey,
      contentHash: contentHash
    };
    
  } catch (error) {
    console.error('\n❌ Transaction failed:', error.message);
    if (error.reason) console.error('   Reason:', error.reason);
    if (error.data) console.error('   Data:', error.data);
    throw error;
  }
}

main()
  .then((result) => {
    console.log('\n🎉 Complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
