const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

// Universal Swaps addresses
const FACTORY = '0xF9bAfd57E49A8cB38465414e4A84560b10ee40e3';
const ROUTER = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';
const WLYX = '0x6b6F4cb50e67adb082300b90Af49AF499D41d04E';

const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';

async function analyze() {
  console.log('🔍 Analyzing Universal Swaps Protocol\n');
  
  // Check if the router has a position manager reference
  const routerAbi = [
    'function factory() view returns (address)',
    'function WETH9() view returns (address)',
    'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)',
    'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)'
  ];
  
  const router = new ethers.Contract(ROUTER, routerAbi, provider);
  
  try {
    const factory = await router.factory();
    const weth = await router.WETH9();
    console.log('Router Factory:', factory);
    console.log('Router WETH9:', weth);
  } catch (e) {
    console.log('Router does not have factory/WETH9 methods');
  }
  
  // Check NonfungiblePositionManager
  // Usually it's deployed by the same deployer
  const factoryAbi = [
    'function owner() view returns (address)'
  ];
  
  const factory = new ethers.Contract(FACTORY, factoryAbi, provider);
  
  try {
    const owner = await factory.owner();
    console.log('\nFactory Owner:', owner);
  } catch (e) {
    console.log('Factory does not have owner method');
  }
  
  // Check for NonfungiblePositionManager events from factory deployer
  console.log('\n🔍 Need to find NonfungiblePositionManager address...');
  console.log('Looking at recent transactions from deployer...');
  
  // The NonfungiblePositionManager is usually deployed with the factory
  // Let me check common patterns
  const commonAddresses = [
    '0xC36442b4a4522E871399CD717aBDD847Ab11FE88', // Mainnet PositionManager
    '0xC36442b4a4522E871399CD717aBDD847Ab11FE88', // Often same
  ];
  
  const positionManagerAbi = [
    'function factory() view returns (address)',
    'function WETH9() view returns (address)'
  ];
  
  for (const addr of commonAddresses) {
    try {
      const pm = new ethers.Contract(addr, positionManagerAbi, provider);
      const pmFactory = await pm.factory();
      if (pmFactory.toLowerCase() === FACTORY.toLowerCase()) {
        console.log('\n✅ Found PositionManager:', addr);
        break;
      }
    } catch (e) {
      // Ignore
    }
  }
  
  console.log('\n📚 Learning from GitHub repo:');
  console.log('- Universal Swaps uses Uniswap V3 style architecture');
  console.log('- TransferHelper uses ILSP7DigitalAsset.transfer()');
  console.log('- Router should work with LSP7 tokens if authorized as operator');
  console.log('- The pay() function in PeripheryPayments handles LSP7');
  
  // Check why our tx failed
  console.log('\n❌ Our addLiquidityETH failed - possible reasons:');
  console.log('1. The Router contract may not be the correct one for liquidity');
  console.log('2. We may need to use NonfungiblePositionManager.mint() instead');
  console.log('3. The pair may not be properly initialized');
}

analyze();