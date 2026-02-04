const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const ROUTER = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';

async function checkSetup() {
  console.log('🔍 Checking AGENTPO Setup\n');
  
  // Check AGENTPO balance
  const lsp7Abi = [
    'function balanceOf(address) view returns (uint256)',
    'function authorizedAmountFor(address operator, address tokenOwner) view returns (uint256)',
    'function getOperatorsOf(address tokenOwner) view returns (address[])'
  ];
  
  const agentpo = new ethers.Contract(AGENTPO, lsp7Abi, provider);
  
  const balance = await agentpo.balanceOf(CONTROLLER);
  console.log('Controller AGENTPO Balance:', ethers.formatEther(balance));
  
  const authorized = await agentpo.authorizedAmountFor(ROUTER, CONTROLLER);
  console.log('Router Authorized Amount:', ethers.formatEther(authorized));
  
  const operators = await agentpo.getOperatorsOf(CONTROLLER);
  console.log('Controller Operators:', operators);
  console.log('Router is operator:', operators.includes(ROUTER.toLowerCase()) ? '✅ Yes' : '❌ No');
  
  console.log('');
  console.log('Required for addLiquidityETH:');
  console.log('  - Controller must have AGENTPO balance: ', balance > 0 ? '✅' : '❌');
  console.log('  - Router must be authorized: ', authorized > 0 ? '✅' : '❌');
  
  if (balance >= ethers.parseEther('100000') && authorized >= ethers.parseEther('100000')) {
    console.log('\n✅ Setup looks correct!');
    console.log('The failure might be due to:');
    console.log('1. The pair not being initialized');
    console.log('2. Slippage too high');
    console.log('3. Price oracle issues');
    console.log('4. Protocol-specific requirements');
  }
}

checkSetup().catch(console.error);