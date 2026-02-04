const { ethers } = require('ethers');
const fs = require('fs');

// Read credentials
const credsFile = fs.readFileSync('.credentials', 'utf8');
const lines = credsFile.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

// LUKSO mainnet
const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

// Contracts
const keyManagerAddress = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const upAddress = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const followerSystemAddress = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';
const potatoTokenAddress = '0x80d898c5a3a0b118a0c8c8adcdbb260fc687f1ce';

// ABI for KeyManager.execute
const keyManagerABI = [
  'function execute(bytes calldata payload) external payable returns (bytes memory)'
];

// ABI for UP.execute
const upABI = [
  'function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)'
];

// ABI for LSP26 FollowerSystem
const followerABI = [
  'function follow(address profileToFollow) external'
];

// ABI for LSP7 (potato token)
const lsp7ABI = [
  'function transfer(address from, address to, uint256 amount, bool force, bytes calldata data) external'
];

// New followers from overnight
const newFollows = [
  '0x514400F1B19312e7700064C919bCa0E0269B8aE5', // theCryptoson
  '0xBbD47382a102E6f966a3339d0647242064aaA747', // Krexxxen  
  '0xAd39ffbD42AB449ADCEEDB83e4Dfb4c238d5eaBD', // criegle
  '0x9797953494aD45Dd40195C6416b289787DB9ABE6'  // 0xantonioeth
];

async function followAndSendPotato() {
  console.log('Following and sending potato to', newFollows.length, 'people...');
  
  try {
    const keyManager = new ethers.Contract(keyManagerAddress, keyManagerABI, wallet);
    const followerContract = new ethers.Contract(followerSystemAddress, followerABI);
    const potatoContract = new ethers.Contract(potatoTokenAddress, lsp7ABI);
    
    // Build calls for each person
    const calls = [];
    
    for (const upToFollow of newFollows) {
      // Call 1: Follow via LSP26
      const followCalldata = followerContract.interface.encodeFunctionData('follow', [upToFollow]);
      const followCall = ethers.concat([
        '0x00000001', // CALL operation type
        ethers.zeroPadValue(followerSystemAddress, 32),
        ethers.zeroPadValue('0x00', 32), // value = 0
        ethers.AbiCoder.defaultAbiCoder().encode(['bytes'], [followCalldata])
      ]);
      calls.push(followCall);
      
      // Call 2: Send 1 potato (1e18 units)
      const potatoAmount = ethers.parseEther('1');
      const potatoCalldata = potatoContract.interface.encodeFunctionData('transfer', [
        upAddress, // from (my UP)
        upToFollow, // to
        potatoAmount, // amount
        true, // force
        '0x' // data
      ]);
      const potatoCall = ethers.concat([
        '0x00000001', // CALL operation type
        ethers.zeroPadValue(potatoTokenAddress, 32),
        ethers.zeroPadValue('0x00', 32), // value = 0
        ethers.AbiCoder.defaultAbiCoder().encode(['bytes'], [potatoCalldata])
      ]);
      calls.push(potatoCall);
    }
    
    // Build batch call to UP
    const upContract = new ethers.Contract(upAddress, upABI);
    const batchCalldata = upContract.interface.encodeFunctionData('execute', [
      4, // DELEGATECALL for batch
      upAddress, // target = self
      0, // value = 0
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes[]'], 
        [calls]
      )
    ]);
    
    // Execute via KeyManager
    console.log('Sending transaction...');
    const tx = await keyManager.execute(batchCalldata, {
      gasLimit: 2000000 // Higher limit for batch
    });
    
    console.log('✅ Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');
    await tx.wait();
    console.log('✅ Confirmed! All', newFollows.length, 'people followed and got potatoes');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

followAndSendPotato();