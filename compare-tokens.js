const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const FACTORY = '0xB718886a34595C09ff5437875079E8ff2365c6E6';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const WLYX = '0x6b6F4cb50e67adb082300b90Af49AF499D41d04E';

// Jordy's token that worked
const WORKING_TOKEN = '0xDF9124ee97d7a8eB8fe845b6C6eE8a8D75B55a57';

async function compareTokens() {
  console.log('🔍 Comparing AGENTPO vs Working Token\n');
  
  // Check both tokens
  const erc20Abi = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)'
  ];
  
  // Working token
  console.log('Working Token (Jordy):', WORKING_TOKEN);
  try {
    const workingToken = new ethers.Contract(WORKING_TOKEN, erc20Abi, provider);
    const wName = await workingToken.name();
    const wSymbol = await workingToken.symbol();
    const wDecimals = await workingToken.decimals();
    const wTotalSupply = await workingToken.totalSupply();
    
    console.log('  Name:', wName);
    console.log('  Symbol:', wSymbol);
    console.log('  Decimals:', wDecimals);
    console.log('  Total Supply:', ethers.formatEther(wTotalSupply));
  } catch (e) {
    console.log('  Error:', e.message);
  }
  
  console.log('');
  
  // AGENTPO
  console.log('AGENTPO:', AGENTPO);
  const lsp7Abi = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)'
  ];
  
  try {
    const agentpo = new ethers.Contract(AGENTPO, lsp7Abi, provider);
    const aName = await agentpo.name();
    const aSymbol = await agentpo.symbol();
    const aDecimals = await agentpo.decimals();
    const aTotalSupply = await agentpo.totalSupply();
    
    console.log('  Name:', aName);
    console.log('  Symbol:', aSymbol);
    console.log('  Decimals:', aDecimals);
    console.log('  Total Supply:', ethers.formatEther(aTotalSupply));
  } catch (e) {
    console.log('  Error:', e.message);
  }
  
  console.log('');
  console.log('📋 Analysis:');
  console.log('- Both are ERC20/LSP7 compatible');
  console.log('- Both have 18 decimals');
  console.log('- Both have sufficient supply');
  console.log('');
  console.log('🤔 Why did pair creation fail?');
  console.log('Possible reasons:');
  console.log('1. Factory has a whitelist/requirement for tokens');
  console.log('2. AGENTPO needs to be verified/approved first');
  console.log('3. Different token ordering required');
  console.log('4. Fee or other requirement');
  console.log('');
  console.log('💡 Solution: Check factory contract directly');
}

compareTokens();