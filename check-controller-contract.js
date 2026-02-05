const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.mainnet.lukso.network';
const provider = new ethers.JsonRpcProvider(RPC_URL);

const CONTROLLER = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';
const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

const LSP6_ABI = [
  'function target() view returns (address)',
  'function getPermissions(address) view returns (bytes)',
  'function getNonce(address,uint128) view returns (uint256)',
];

async function check() {
  const code = await provider.getCode(CONTROLLER);
  console.log('Controller code length:', code.length);
  console.log('Controller is contract:', code !== '0x');
  
  if (code !== '0x') {
    const km = new ethers.Contract(CONTROLLER, LSP6_ABI, provider);
    
    try {
      const target = await km.target();
      console.log('\nController is Key Manager for:', target);
      console.log('Target is Owner UP:', target.toLowerCase() === OWNER_UP.toLowerCase());
    } catch (e) {
      console.log('Not a Key Manager:', e.message);
    }
  }
}

check().catch(console.error);
