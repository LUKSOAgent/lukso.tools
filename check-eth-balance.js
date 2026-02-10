const { ethers } = require('ethers');

const EOA = '0x899C7642802E294857b19754a2377F8e74dA9319';
const STAKEWISE_VAULT = '0x8A93A876912c9F03F88Bc9114847cf5b63c89f56';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

async function checkBalances() {
  const balance = await provider.getBalance(EOA);
  console.log('EOA ETH balance:', ethers.formatEther(balance), 'ETH');
  
  const vaultCode = await provider.getCode(STAKEWISE_VAULT);
  console.log('Vault has code:', vaultCode.length > 2);
}

checkBalances().catch(console.error);
