const { ethers } = require('ethers');

// Configuration
const UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CONTROLLER_PK = '0xREDACTED_PRIVATE_KEY_1';
const DATA_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';
const DATA_VALUE = '0x6f357c6aa56e0dc457caf114e3138472f5f6516520132a27a546dd280203d856a58104db68747470733a2f2f697066732e696f2f697066732f6261667962656966716f7379336b787862637572346e376575716771703661697772346e6f667537356f376875706f696b6f377936706873736869';

// LSP6 KeyManager ABI
const KEY_MANAGER_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "payload",
        "type": "bytes"
      }
    ],
    "name": "execute",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
];

// LSP0 ERC725Y ABI for encoding setData
const ERC725Y_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "dataKey",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "dataValue",
        "type": "bytes"
      }
    ],
    "name": "setData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function main() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(CONTROLLER_PK, provider);
  
  console.log('Controller address:', wallet.address);
  
  // Create interface for encoding the setData call
  const erc725Interface = new ethers.Interface(ERC725Y_ABI);
  
  // Encode the setData call that will be executed on the UP
  const setDataPayload = erc725Interface.encodeFunctionData('setData', [DATA_KEY, DATA_VALUE]);
  console.log('Encoded setData payload:', setDataPayload);
  
  // Create KeyManager contract instance
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  console.log('Sending execute transaction to KeyManager...');
  console.log('KeyManager:', KEY_MANAGER);
  
  try {
    // Send transaction - call execute on KeyManager with the encoded setData payload
    const tx = await keyManager.execute(setDataPayload);
    console.log('Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed!');
    console.log('Block number:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    
    return tx.hash;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

main()
  .then(hash => {
    console.log('\n=== SUCCESS ===');
    console.log('Transaction hash:', hash);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n=== FAILED ===');
    console.error(error);
    process.exit(1);
  });
