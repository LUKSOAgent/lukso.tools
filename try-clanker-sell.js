const { ethers } = require('ethers');

const walletAddress = '0x899C7642802E294857b19754a2377F8e74dA9319';
const LUKSO_TOKEN = '0x81040cfd2bb62062525d958aD01931988a590B07';

const provider = new ethers.JsonRpcProvider('https://base.publicnode.com');
const wallet = new ethers.Wallet('0xREDACTED_PRIVATE_KEY_2', provider);

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// Common Clanker contract functions
const CLANKER_ABI = [
  "function sell(uint256 amount) external",
  "function getSellPrice(uint256 amount) external view returns (uint256)",
  "function getMarketCap() external view returns (uint256)"
];

async function tryClankerSell() {
  try {
    // Check token balance
    const lukso = new ethers.Contract(LUKSO_TOKEN, ERC20_ABI, wallet);
    const balance = await lukso.balanceOf(walletAddress);
    const decimals = await lukso.decimals();
    
    console.log('LUKSO balance:', ethers.formatUnits(balance, decimals));
    
    // Try to find sell function in token contract
    console.log('\nChecking if token has direct sell functionality...');
    
    // Try calling common function signatures
    const sellSig = '0x29b98c5b'; // sell(uint256)
    const getPriceSig = '0x4f0e0f73'; // getSellPrice(uint256)
    
    // Try getSellPrice for 1000 tokens
    const testAmount = ethers.parseUnits('1000', decimals);
    
    try {
      const priceData = await provider.call({
        to: LUKSO_TOKEN,
        data: getPriceSig + testAmount.toString(16).padStart(64, '0')
      });
      console.log('getSellPrice result:', priceData);
    } catch(e) {
      console.log('No getSellPrice function');
    }
    
    // Check if there's a factory or deployer
    console.log('\nToken contract:', LUKSO_TOKEN);
    console.log('You may need to use the Clanker frontend to sell');
    console.log('https://www.clanker.world/clanker/' + LUKSO_TOKEN);
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

tryClankerSell();
