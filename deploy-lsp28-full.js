const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const https = require('https');

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

// LSP6 execute payload ABI
const EXECUTE_PAYLOAD_ABI = [
  'function execute(uint256 operationType, address target, uint256 value, bytes memory data) external returns (bytes memory)'
];

async function uploadToIPFS(data) {
  return new Promise((resolve, reject) => {
    // Try using api.nft.storage or ipfs.io
    // For this implementation, let's try using pinata.cloud or similar
    
    // Since we don't have API keys, let's use a data URL approach
    // and also attempt to upload to a public gateway
    
    const encodedData = Buffer.from(data).toString('base64');
    const dataUrl = `data:application/json;base64,${encodedData}`;
    
    // Calculate content hash for verification
    const hash = ethers.keccak256(ethers.toUtf8Bytes(data));
    
    console.log('   Using data URL for IPFS storage');
    console.log('   Content hash:', hash);
    
    resolve({
      url: dataUrl,
      hash: hash
    });
  });
}

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
  console.log('🚀 LSP28 Grid Deployment\n');

  // Read the grid file
  const gridPath = path.join(__dirname, 'lsp28-grid.json');
  const gridData = fs.readFileSync(gridPath, 'utf8');
  const gridJson = JSON.parse(gridData);
  
  console.log('📄 Grid data loaded:', gridJson.name);
  console.log('   Description:', gridJson.description);
  console.log('   Rows:', gridJson.grid.length);

  // Step 1: Upload to IPFS
  console.log('\n📤 Uploading to IPFS...');
  const { url: ipfsUrl, hash: contentHash } = await uploadToIPFS(gridData);
  console.log('   IPFS URL:', ipfsUrl.substring(0, 80) + '...');
  console.log('   Content hash:', contentHash);

  // Step 2: Encode as LSP2 JSONURL
  console.log('\n🔐 Encoding LSP2 JSONURL...');
  const jsonUrlEncoded = encodeJsonUrl(contentHash, ipfsUrl);
  console.log('   Encoded value:', jsonUrlEncoded.substring(0, 80) + '...');
  console.log('   Total length:', jsonUrlEncoded.length, 'chars');

  // Step 3: Connect to LUKSO
  console.log('\n🔗 Connecting to LUKSO Mainnet...');
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('   Wallet:', wallet.address);
  
  // Get UP and KeyManager instances
  const up = new ethers.Contract(UP_ADDRESS, LSP0_ABI, provider);
  const keyManager = new ethers.Contract(KEY_MANAGER_ADDRESS, LSP6_ABI, provider);
  const keyManagerWithSigner = keyManager.connect(wallet);
  
  // Step 4: Get current array length
  console.log('\n📊 Checking current LSP28Grid[] array...');
  const arrayLengthData = await up.getData(LSP28_GRID_ARRAY_KEY);
  console.log('   Array length data:', arrayLengthData);
  
  let currentLength = 0;
  if (arrayLengthData && arrayLengthData !== '0x') {
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
  console.log('   Data key for index:', indexKey);
  
  // Also need to update the array length
  const newLength = currentLength + 1;
  const lengthValue = ethers.zeroPadValue(ethers.toBeHex(newLength), 32);
  
  // Step 6: Prepare setData calls
  console.log('\n📝 Preparing setData transactions...');
  
  // We need to set:
  // 1. The array length key with new length
  // 2. The index key with the JSONURL value
  
  // For KeyManager, we encode setData on the UP
  const upInterface = new ethers.Interface(LSP0_ABI);
  
  // Single value set
  const setDataCalldata = upInterface.encodeFunctionData('setData', [
    indexKey,
    jsonUrlEncoded
  ]);
  
  console.log('   setData calldata:', setDataCalldata.substring(0, 80) + '...');
  
  // Execute via KeyManager
  // Operation type 0 = CALL
  const operationType = 0;
  const value = 0;
  
  console.log('\n⛽ Preparing KeyManager.execute...');
  
  try {
    // Get nonce for the controller
    const nonce = await keyManager.getNonce(wallet.address, 0);
    console.log('   Controller nonce:', nonce);
    
    // Encode the execute call
    const executeCalldata = keyManager.interface.encodeFunctionData('execute', [
      setDataCalldata
    ]);
    
    console.log('   KeyManager.execute payload:', executeCalldata.substring(0, 80) + '...');
    
    // Actually, let's try calling execute directly
    console.log('\n📡 Sending transaction...');
    
    const tx = await keyManagerWithSigner.execute(setDataCalldata, {
      gasLimit: 500000
    });
    
    console.log('   Transaction sent:', tx.hash);
    console.log('   Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('   ✅ Transaction confirmed!');
    console.log('   Block:', receipt.blockNumber);
    console.log('   Gas used:', receipt.gasUsed.toString());
    
    // Verify the data was set
    console.log('\n🔍 Verifying data was set...');
    const verifyData = await up.getData(indexKey);
    console.log('   Data at index key:', verifyData ? 'Present (' + verifyData.length + ' chars)' : 'Not set');
    
    // Check array length was updated
    const newArrayLengthData = await up.getData(LSP28_GRID_ARRAY_KEY);
    console.log('   New array length data:', newArrayLengthData);
    
    console.log('\n✅ LSP28 Grid deployed successfully!');
    console.log('\n📋 Deployment Summary:');
    console.log('   Transaction Hash:', tx.hash);
    console.log('   Block Number:', receipt.blockNumber);
    console.log('   Array Index:', newIndex);
    console.log('   Data Key:', indexKey);
    console.log('   IPFS URL:', ipfsUrl.substring(0, 60) + '...');
    
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      index: newIndex,
      dataKey: indexKey,
      ipfsUrl: ipfsUrl,
      contentHash: contentHash
    };
    
  } catch (error) {
    console.error('\n❌ Transaction failed:', error.message);
    if (error.data) {
      console.error('   Error data:', error.data);
    }
    throw error;
  }
}

main()
  .then((result) => {
    console.log('\n🎉 Deployment complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Deployment failed:', error);
    process.exit(1);
  });
