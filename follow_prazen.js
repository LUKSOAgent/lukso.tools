const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

const PRAZEN_UP = '0x1c02b51c435b3f1336eaab3c4efa5cb75a49976a';
const LSP26_FOLLOWER_SYSTEM = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';

async function followPrazen() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('🔧 FOLLOWING PRAZEN');
  console.log('===================\n');
  console.log('Target UP:', PRAZEN_UP);
  console.log('LSP26:', LSP26_FOLLOWER_SYSTEM);
  
  // Encode LSP26 follow call
  const lsp26Interface = new ethers.Interface([
    'function follow(address target) external'
  ]);
  const followCalldata = lsp26Interface.encodeFunctionData('follow', [PRAZEN_UP]);
  
  console.log('\nFollow calldata:', followCalldata);
  
  // Execute via UP -> KeyManager
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  const upInterface = new ethers.Interface([
    'function execute(uint256 operationType, address target, uint256 value, bytes calldata data) external'
  ]);
  
  const payload = upInterface.encodeFunctionData('execute', [
    0, // CALL
    LSP26_FOLLOWER_SYSTEM,
    0,
    followCalldata
  ]);
  
  console.log('\nSending transaction...');
  try {
    const tx = await keyManager.execute(payload, { gasLimit: 300000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ SUCCESS! Gas:', receipt.gasUsed.toString());
    console.log('\nNow following @Prazen!');
    console.log('Let\'s see if the PotatoTipper sends me some POTATO too 😉');
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

followPrazen();