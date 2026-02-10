const { ethers } = require('ethers');

const EOA = '0x899C7642802E294857b19754a2377F8e74dA9319';

async function checkBalances() {
  console.log('🔍 Checking Balances for:', EOA);
  console.log('');
  
  // Ethereum Mainnet
  const ethProvider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
  
  // Base
  const baseProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  
  // Arbitrum (bonus)
  const arbProvider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
  
  console.log('📊 ETHEREUM MAINNET');
  console.log('─────────────────────────────────');
  try {
    const ethBalance = await ethProvider.getBalance(EOA);
    console.log('ETH Balance:', ethers.formatEther(ethBalance), 'ETH');
    
    // Check for common tokens
    const wethContract = new ethers.Contract(
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      ['function balanceOf(address) view returns (uint256)'],
      ethProvider
    );
    const usdcContract = new ethers.Contract(
      '0xA0b86a33E6441e8ae611eB4D0b68f1e9E8A9d8e6',
      ['function balanceOf(address) view returns (uint256)'],
      ethProvider
    );
    
    try {
      const wethBal = await wethContract.balanceOf(EOA);
      if (wethBal > 0) console.log('WETH:', ethers.formatEther(wethBal), 'WETH');
    } catch (e) {}
    
  } catch (err) {
    console.log('Error:', err.message);
  }
  
  console.log('');
  console.log('🔵 BASE');
  console.log('─────────────────────────────────');
  try {
    const baseBalance = await baseProvider.getBalance(EOA);
    console.log('ETH Balance:', ethers.formatEther(baseBalance), 'ETH');
    
    // Check common Base tokens
    const usdcBase = new ethers.Contract(
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      ['function balanceOf(address) view returns (uint256)'],
      baseProvider
    );
    const wethBase = new ethers.Contract(
      '0x4200000000000000000000000000000000000006',
      ['function balanceOf(address) view returns (uint256)'],
      baseProvider
    );
    
    try {
      const usdcBal = await usdcBase.balanceOf(EOA);
      if (usdcBal > 0) console.log('USDC:', (Number(usdcBal) / 1e6).toFixed(2), 'USDC');
    } catch (e) {}
    
    try {
      const wethBal = await wethBase.balanceOf(EOA);
      if (wethBal > 0) console.log('WETH:', ethers.formatEther(wethBal), 'WETH');
    } catch (e) {}
    
  } catch (err) {
    console.log('Error:', err.message);
  }
  
  console.log('');
  console.log('🔶 ARBITRUM (Bonus)');
  console.log('─────────────────────────────────');
  try {
    const arbBalance = await arbProvider.getBalance(EOA);
    console.log('ETH Balance:', ethers.formatEther(arbBalance), 'ETH');
  } catch (err) {
    console.log('Error:', err.message);
  }
}

checkBalances().catch(console.error);
