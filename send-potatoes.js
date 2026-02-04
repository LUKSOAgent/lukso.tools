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
const potatoTokenAddress = '0x80d898c5a3a0b118a0c8c8adcdbb260fc687f1ce';

const keyManagerABI = ['function execute(bytes calldata payload) external payable returns (bytes memory)'];
const upABI = ['function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external payable returns (bytes memory)'];
const lsp7ABI = ['function transfer(address from, address to, uint256 amount, bool force, bytes calldata data) external'];

const newFollows = [
  { name: 'theCryptoson', address: '0x514400F1B19312e7700064C919bCa0E0269B8aE5' },
  { name: 'Krexxxen', address: '0xBbD47382a102E6f966a3339d0647242064aaA747' },
  { name: 'criegle', address: '0xAd39ffbD42AB449ADCEEDB83e4Dfb4c238d5eaBD' },
  { name: '0xantonioeth', address: '0x9797953494aD45Dd40195C6416b289787DB9ABE6' }
];

async function sendPotatoes() {
  const keyManager = new ethers.Contract(keyManagerAddress, keyManagerABI, wallet);
  const upContract = new ethers.Contract(upAddress, upABI);
  const potatoContract = new ethers.Contract(potatoTokenAddress, lsp7ABI);
  
  for (const person of newFollows) {
    try {
      console.log(`\nSending potato to ${person.name}...`);
      
      const potatoAmount = ethers.parseEther('1'); // 1 potato
      const potatoCalldata = potatoContract.interface.encodeFunctionData('transfer', [
        upAddress, // from
        person.address, // to
        potatoAmount,
        true, // force
        '0x' // data
      ]);
      
      const upExecuteCalldata = upContract.interface.encodeFunctionData('execute', [
        0,
        potatoTokenAddress,
        0,
        potatoCalldata
      ]);
      
      const tx = await keyManager.execute(upExecuteCalldata, {
        gasLimit: 300000
      });
      
      console.log(`✅ ${person.name} potato sent:`, tx.hash);
      await tx.wait();
      console.log(`✅ ${person.name} potato confirmed!`);
      
      // Delay between sends
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ ${person.name} potato failed:`, error.message);
    }
  }
  
  console.log('\n🥔 All potatoes sent!');
}

sendPotatoes();