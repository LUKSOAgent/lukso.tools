const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.mainnet.lukso.network';
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER_ADDRESS = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const LSP28_KEY = '0x0a23000000000000000000000000000000000000000000000000000000000000';

const LSP0_ABI = [
  'function getData(bytes32 dataKey) view returns (bytes)',
  'function setData(bytes32 dataKey, bytes memory dataValue) external'
];

const LSP6_ABI = [
  'function execute(bytes calldata payload) external payable returns (bytes memory)'
];

async function main() {
  console.log('🔄 Updating LSP28Grid[] array length...\n');
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  const up = new ethers.Contract(UP_ADDRESS, LSP0_ABI, provider);
  const keyManager = new ethers.Contract(KEY_MANAGER_ADDRESS, LSP6_ABI, wallet);
  
  // Check current array length
  const currentLengthData = await up.getData(LSP28_KEY);
  console.log('Current array length data:', currentLengthData);
  
  let currentLength = 0;
  if (currentLengthData && currentLengthData !== '0x' && currentLengthData.length >= 66) {
    currentLength = parseInt(currentLengthData.slice(-64), 16);
  }
  
  console.log('Current length:', currentLength);
  
  // If length is 0 but we have data at index 0, we need to update it
  const indexKey = ethers.keccak256(
    ethers.solidityPacked(['bytes32', 'uint256'], [LSP28_KEY, 0])
  );
  const indexData = await up.getData(indexKey);
  
  console.log('Data at index 0:', indexData ? 'Present' : 'Not found');
  
  if (currentLength === 0 && indexData && indexData !== '0x') {
    console.log('\n📊 Array length needs update. Setting to 1...');
    
    // Encode new length (1)
    const newLength = 1;
    const lengthValue = ethers.zeroPadValue(ethers.toBeHex(newLength), 32);
    
    // Encode setData call for UP
    const upInterface = new ethers.Interface(LSP0_ABI);
    const setDataCalldata = upInterface.encodeFunctionData('setData', [
      LSP28_KEY,
      lengthValue
    ]);
    
    console.log('New length value:', lengthValue);
    
    // Execute via KeyManager
    const tx = await keyManager.execute(setDataCalldata, {
      gasLimit: 200000
    });
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('✅ Confirmed in block', receipt.blockNumber);
    
    // Verify
    const newLengthData = await up.getData(LSP28_KEY);
    const verifiedLength = parseInt(newLengthData.slice(-64), 16);
    console.log('\n✅ Array length updated to:', verifiedLength);
    
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      newLength: verifiedLength
    };
  } else {
    console.log('\n✅ Array length already correct:', currentLength);
  }
}

main().catch(console.error);
