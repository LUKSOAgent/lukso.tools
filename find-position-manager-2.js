const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const FACTORY = '0xf9bafd57e49a8cb38465414e4a84560b10ee40e3'; // lowercase

async function findPositionManager() {
  console.log('🔍 Finding NonfungiblePositionManager\n');
  
  // Method 1: Look at the successful liquidity addition example from Jordy
  // Transaction: 0x81195750a4ec859286f91e95b2b9697cd35513081da314aed05a4c5b10b0b2c0
  const exampleTx = '0x81195750a4ec859286f91e95b2b9697cd35513081da314aed05a4c5b10b0b2c0';
  const tx = await provider.getTransaction(exampleTx);
  
  console.log('Example transaction from Jordy:');
  console.log('  To:', tx.to);
  console.log('  This might be the PositionManager or Router!');
  console.log('');
  
  // Check if this address has the PositionManager interface
  const candidate = tx.to;
  const code = await provider.getCode(candidate);
  console.log('Candidate address:', candidate);
  console.log('Code length:', code.length);
  
  // Check for mint function
  const mintSelector = ethers.id('mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))').slice(0, 10);
  const hasMint = code.includes(mintSelector.slice(2));
  
  console.log('');
  console.log('Checking for PositionManager.mint():', hasMint ? '✅' : '❌');
  
  if (hasMint) {
    console.log('\n✅ FOUND! This is the NonfungiblePositionManager!');
    console.log('Address:', candidate);
    
    // Verify with factory call
    const pmAbi = ['function factory() view returns (address)'];
    const pm = new ethers.Contract(candidate, pmAbi, provider);
    
    try {
      const factory = await pm.factory();
      console.log('Factory:', factory);
      
      if (factory.toLowerCase() === FACTORY) {
        console.log('✅ Confirmed: Factory matches!');
      }
    } catch (e) {
      console.log('Could not verify factory:', e.message);
    }
    
    return candidate;
  }
  
  // Check if it's the router instead
  const addLiquidityETHSelector = ethers.id('addLiquidityETH(address,uint256,uint256,uint256,address,uint256)').slice(0, 10);
  const hasAddLiquidityETH = code.includes(addLiquidityETHSelector.slice(2));
  
  console.log('Checking for Router.addLiquidityETH():', hasAddLiquidityETH ? '✅' : '❌');
  
  if (hasAddLiquidityETH && !hasMint) {
    console.log('\n⚠️ This is the Router, not the PositionManager');
    console.log('For V3, we need the PositionManager, not the Router!');
  }
  
  return null;
}

findPositionManager();