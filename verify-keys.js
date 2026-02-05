const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const wallet = new ethers.Wallet(PRIVATE_KEY);

console.log('Private Key derived address:', wallet.address);
console.log('Controller address from credentials: 0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5');
console.log('Match:', wallet.address.toLowerCase() === '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5'.toLowerCase());

// Check if controller is an EOA on LUKSO
const RPC_URL = 'https://rpc.mainnet.lukso.network';
const provider = new ethers.JsonRpcProvider(RPC_URL);

async function check() {
  const controllerCode = await provider.getCode('0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5');
  console.log('\nController 0x50Faa348... code length:', controllerCode.length);
  console.log('Controller is EOA:', controllerCode === '0x');
  
  // Get controller of owner UP
  const ownerUP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
  const ownerCode = await provider.getCode(ownerUP);
  console.log('\nOwner UP code length:', ownerCode.length);
}

check().catch(console.error);
