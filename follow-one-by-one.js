const { ethers } = require('ethers');
const fs = require('fs');

// Read credentials
const credsFile = fs.readFileSync('.credentials', 'utf8');
const lines = credsFile.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const keyManagerAddress = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const upAddress = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const followerSystemAddress = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';
const potatoTokenAddress = '0x80d898c5a3a0b118a0c8c8adcdbb260fc687f1ce';

const keyManagerABI = ['function execute(bytes calldata payload) external payable returns (bytes memory)'];
const upABI = ['function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)'];
const followerABI = ['function follow(address profileToFollow) external'];
const lsp7ABI = ['function transfer(address from, address to, uint256 amount, bool force, bytes calldata data) external'];

const newFollows = [
  { address: '0x514400F1B19312e7700064C919bCa0E0269B8aE5', name: 'theCryptoson' },
  { address: '0xBbD47382a102E6f966a3339d0647242064aaA747', name: 'Krexxxen' },
  { address: '0xAd39ffbD42AB449ADCEEDB83e4Dfb4c238d5eaBD', name: 'criegle' },
  { address: '0x9797953494aD45Dd40195C6416b289787DB9ABE6', name: '0xantonioeth' }
];

async function followOneByOne() {
  const keyManager = new ethers.Contract(keyManagerAddress, keyManagerABI, wallet);
  
  for (const person of newFollows) {
    try {
      console.log(`\nFollowing ${person.name} (${person.address})...`);
      
      // Step 1: Follow
      const followerContract = new ethers.Contract(followerSystemAddress, followerABI);
      const followCalldata = followerContract.interface.encodeFunctionData('follow', [person.address]);
      
      const followExecute = ethers.concat([
        '0x00000001', // CALL
        ethers.zeroPadValue(followerSystemAddress, 32),
        ethers.zeroPadValue('0x00', 32), // value = 0
        ethers.AbiCoder.defaultAbiCoder().encode(['bytes'], [followCalldata])
      ]);
      
      const followTx = await keyManager.execute(followExecute, { gasLimit: 500000 });
      console.log(`✅ Follow tx:`, followTx.hash);
      await followTx.wait();
      
      // Step 2: Send potato (separate transaction)
      const potatoContract = new ethers.Contract(potatoTokenAddress, lsp7ABI);
      const potatoAmount = ethers.parseEther('1');
      const potatoCalldata = potatoContract.interface.encodeFunctionData('transfer', [
        upAddress,
        person.address,
        potatoAmount,
        true,
        '0x'
      ]);
      
      const potatoExecute = ethers.concat([
        '0x00000001', // CALL
        ethers.zeroPadValue(potatoTokenAddress, 32),
        ethers.zeroPadValue('0x00', 32), // value = 0
        ethers.AbiCoder.defaultAbiCoder().encode(['bytes'], [potatoCalldata])
      ]);
      
      const potatoTx = await keyManager.execute(potatoExecute, { gasLimit: 500000 });
      console.log(`✅ Potato tx:`, potatoTx.hash);
      await potatoTx.wait();
      
      console.log(`✅ ${person.name} fully processed!`);
      
      // Small delay between people
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed for ${person.name}:`, error.message);
    }
  }
}

followOneByOne();