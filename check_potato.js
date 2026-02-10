const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const POTATO_TOKEN = '0x80D898C5A3A0B118a0c8C8aDcdBB260FC687F1ce';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const lsp7Abi = [
    'function balanceOf(address tokenOwner) external view returns (uint256)',
    'function decimals() external view returns (uint8)'
  ];
  
  const potato = new ethers.Contract(POTATO_TOKEN, lsp7Abi, provider);
  
  const balance = await potato.balanceOf(MY_UP);
  const decimals = await potato.decimals();
  
  console.log('My POTATO balance:', ethers.formatUnits(balance, decimals));
}

check();
