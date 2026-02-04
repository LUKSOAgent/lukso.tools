const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const FACTORY = '0xF9bAfd57E49A8cB38465414e4A84560b10ee40e3';

async function findPositionManager() {
  console.log('🔍 Finding NonfungiblePositionManager\n');
  
  // Method 1: Look for recent PoolCreated events and track the deployer
  const factoryAbi = [
    'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)'
  ];
  
  const factory = new ethers.Contract(FACTORY, factoryAbi, provider);
  
  // Get recent events
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = currentBlock - 10000; // Last ~10000 blocks
  
  console.log('Scanning blocks', fromBlock, 'to', currentBlock, '...');
  console.log('This may take a while...\n');
  
  try {
    // Get PoolCreated events
    const filter = factory.filters.PoolCreated();
    const events = await factory.queryFilter(filter, fromBlock, currentBlock);
    
    console.log('Found', events.length, 'PoolCreated events');
    
    if (events.length > 0) {
      // Get the transaction that created the most recent pool
      const txHash = events[events.length - 1].transactionHash;
      const tx = await provider.getTransaction(txHash);
      
      console.log('\nMost recent pool creation:');
      console.log('  Tx Hash:', txHash);
      console.log('  From:', tx.from);
      console.log('  To:', tx.to);
      
      // Check if this is the PositionManager
      if (tx.to) {
        const code = await provider.getCode(tx.to);
        console.log('  Code length:', code.length);
        
        // Check for position manager specific functions
        const positionManagerSigs = [
          ethers.id('mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))').slice(0, 10),
          ethers.id('positions(uint256)').slice(0, 10)
        ];
        
        console.log('\n  Checking PositionManager signatures:');
        for (const sig of positionManagerSigs) {
          const hasSig = code.includes(sig.slice(2));
          console.log(`    ${sig}: ${hasSig ? '✅' : '❌'}`);
        }
        
        if (code.length > 20000) {
          console.log('\n  This looks like it could be the PositionManager!');
          console.log('  Address:', tx.to);
        }
      }
    }
  } catch (e) {
    console.log('Error scanning events:', e.message);
  }
  
  // Method 2: Try common addresses
  console.log('\n\n🔍 Trying common PositionManager addresses...');
  
  // These are often deployed close to the factory
  // Or we can try to compute them
  const commonAddresses = [
    '0xC36442b4a4522E871399CD717aBDD847Ab11FE88', // Mainnet PositionManager
    '0x1238536071E1c677A632429e3655c799b22cD3d1', // Possible testnet/mainnet variant
  ];
  
  const pmAbi = [
    'function factory() view returns (address)',
    'function WETH9() view returns (address)'
  ];
  
  for (const addr of commonAddresses) {
    try {
      const pm = new ethers.Contract(addr, pmAbi, provider);
      const pmFactory = await pm.factory();
      
      if (pmFactory.toLowerCase() === FACTORY.toLowerCase()) {
        console.log('\n✅ FOUND PositionManager:', addr);
        const weth = await pm.WETH9();
        console.log('  WETH9:', weth);
        return;
      }
    } catch (e) {
      // Not the right one
    }
  }
  
  console.log('\n❌ Could not find PositionManager automatically');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Check Universal Swaps documentation');
  console.log('2. Ask in LUKSO Discord');
  console.log('3. Look at the deployment transactions on explorer');
}

findPositionManager();