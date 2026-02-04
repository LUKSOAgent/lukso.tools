const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const FACTORY = '0xB718886a34595C09ff5437875079E8ff2365c6E6';

// Jordy's address
const JORDY = '0xda2eb5b82e1e0bb063800c2cd9ba90a5555700f7';
// My controller
const ME = '0xE093A714960da1bF297522617BfC08132b62B86a';

async function checkPermissions() {
  console.log('🔍 Checking Factory Permissions\n');
  
  const factoryAbi = [
    'function feeToSetter() view returns (address)',
    'function feeTo() view returns (address)'
  ];
  
  const factory = new ethers.Contract(FACTORY, factoryAbi, provider);
  
  const feeToSetter = await factory.feeToSetter();
  const feeTo = await factory.feeTo();
  
  console.log('Factory Admin:');
  console.log('  Fee To Setter:', feeToSetter);
  console.log('  Fee To:', feeTo);
  console.log('');
  
  console.log('Comparison:');
  console.log('  Jordy:', JORDY);
  console.log('  Is Jordy the setter?', JORDY.toLowerCase() === feeToSetter.toLowerCase() ? '✅ YES' : '❌ No');
  console.log('');
  console.log('  Me:', ME);
  console.log('  Am I the setter?', ME.toLowerCase() === feeToSetter.toLowerCase() ? '✅ YES' : '❌ No');
  console.log('');
  
  if (JORDY.toLowerCase() === feeToSetter.toLowerCase()) {
    console.log('🎯 CONCLUSION:');
    console.log('Jordy is the factory owner!');
    console.log('Only the owner can create pairs.');
    console.log('');
    console.log('Solutions:');
    console.log('1. Ask Jordy to create the AGENTPO/WLYX pair');
    console.log('2. Ask Jordy to transfer ownership or add me as allowed creator');
    console.log('3. Use the existing pair structure differently');
  }
}

checkPermissions();