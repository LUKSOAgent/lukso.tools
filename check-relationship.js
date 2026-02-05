const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.mainnet.lukso.network';
const provider = new ethers.JsonRpcProvider(RPC_URL);

const OWNER_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';
const DEPLOYER = '0xE093A714960da1bF297522617BfC08132b62B86a';

const UP_ABI = [
  'function owner() view returns (address)',
  'function getData(bytes32) view returns (bytes)',
  'function getDataBatch(bytes32[]) view returns (bytes[])'
];

// LSP6 Key Manager permission keys
const LSP6_PERMISSIONS_KEY = '0x4b80742de2bf82acb3630000'; // prefix for permissions

async function check() {
  const up = new ethers.Contract(OWNER_UP, UP_ABI, provider);
  
  // Check owner of UP
  try {
    const owner = await up.owner();
    console.log('Owner UP owner():', owner);
  } catch (e) {
    console.log('Could not get owner:', e.message);
  }
  
  // Check if controller is the Key Manager
  console.log('\nChecking if controller matches Key Manager...');
  
  // Check if deployer is the controller (maybe credentials have wrong info)
  console.log('\nDeployer address:', DEPLOYER);
  console.log('Controller address:', CONTROLLER);
  console.log('Are they the same?', DEPLOYER.toLowerCase() === CONTROLLER.toLowerCase());
  
  // Check code at controller
  const controllerCode = await provider.getCode(CONTROLLER);
  console.log('\nController has code:', controllerCode !== '0x');
  if (controllerCode !== '0x') {
    console.log('Controller is a contract - checking if it is Key Manager...');
  }
}

check().catch(console.error);
