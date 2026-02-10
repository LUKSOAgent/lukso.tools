const { ethers } = require('ethers');

const walletAddress = '0x899C7642802E294857b19754a2377F8e74dA9319';
const walletKey = '0xREDACTED_PRIVATE_KEY_2';
const recipient = '0x820CB7D79A15a66Cb0247fB3d5a9AC2f1644938B';

const USDC = ethers.getAddress('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913');

const provider = new ethers.JsonRpcProvider('https://base.publicnode.com');
const wallet = new ethers.Wallet(walletKey, provider);

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

async function sendAllUSDC() {
  try {
    // Check USDC balance
    const usdc = new ethers.Contract(USDC, ERC20_ABI, wallet);
    const balance = await usdc.balanceOf(walletAddress);
    const decimals = await usdc.decimals();
    
    console.log('USDC balance:', ethers.formatUnits(balance, decimals));
    
    if (balance === 0n) {
      console.log('No USDC to send');
      return;
    }
    
    // Send all USDC to recipient
    console.log('Sending USDC to recipient...');
    const tx = await usdc.transfer(recipient, balance);
    const receipt = await tx.wait();
    
    console.log('Transfer complete! TX:', receipt.hash);
    console.log('Sent', ethers.formatUnits(balance, decimals), 'USDC to', recipient);
    
  } catch(e) {
    console.error('Error:', e.message);
    if (e.code) console.error('Code:', e.code);
  }
}

sendAllUSDC();
