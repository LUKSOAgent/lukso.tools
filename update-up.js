const { ethers } = require('ethers');

// Configuration
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CONTROLLER_PK = '0xREDACTED_PRIVATE_KEY_1';
const DATA_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';
const DATA_VALUE = '0x6f357c6aa56e0dc457caf114e3138472f5f6516520132a27a546dd280203d856a58104db68747470733a2f2f697066732e696f2f697066732f6261667962656966716f7379336b787862637572346e376575716771703661697772346e6f667537356f376875706f696b6f377936706873736869';

// KeyManager ABI (only setData function)
const KEY_MANAGER_ABI = [
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
  // Connect to LUKSO mainnet
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(CONTROLLER_PK, provider);
  
  console.log('Controller address:', wallet.address);
  
  // Create KeyManager contract instance
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  console.log('Updating UP data...');
  console.log('Key:', DATA_KEY);
  console.log('Value:', DATA_VALUE);
  
  try {
    // Send transaction
    const tx = await keyManager.setData(DATA_KEY, DATA_VALUE);
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
