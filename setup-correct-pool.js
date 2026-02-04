const { ethers } = require('ethers');
const fs = require('fs');

const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const WLYX1 = '0x2dB41674F2b882889e5E1Bd09a3f3613952bC472'; // CORRECT!
const PM = '0x855bb3e40261a73dd4fc691fc024cc7d60794d00';
const FACTORY = '0x8130C332Dddf8964B08eab86AAD3999017436A6E';

const FACTORY_ABI = ['function createPool(address tokenA, address tokenB, uint24 fee) returns (address pool)'];
const POOL_ABI = ['function initialize(uint160 sqrtPriceX96) external'];
const PM_ABI = ['function mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)'];
const LSP7_ABI = ['function authorizeOperator(address operator, uint256 amount, bytes memory operatorNotificationData)'];
const WLYX_ABI = ['function deposit() payable', 'function approve(address spender, uint256 amount) returns (bool)'];

async function setupPool() {
  console.log('🎯 Setting up AGENTPO/WLYX1 Pool\n');
  console.log('Using CORRECT WLYX1:', WLYX1);
  console.log('');
  
  // Step 1: Create pool
  console.log('1. Creating pool...');
  const factory = new ethers.Contract(FACTORY, FACTORY_ABI, wallet);
  const tx1 = await factory.createPool(AGENTPO, WLYX1, 3000, { gasLimit: 5000000 });
  const receipt1 = await tx1.wait();
  
  // Get pool address from event
  const poolCreatedTopic = ethers.id('PoolCreated(address,address,uint24,int24,address)');
  const event = receipt1.logs.find(log => log.topics[0] === poolCreatedTopic);
  const poolAddress = '0x' + event.data.slice(26, 66);
  console.log('   Pool:', poolAddress);
  
  // Step 2: Initialize pool
  console.log('2. Initializing pool...');
  const pool = new ethers.Contract(poolAddress, POOL_ABI, wallet);
  // Price: 1 AGENTPO = 0.0001 WLYX
  const sqrtPriceX96 = BigInt(Math.floor(Math.sqrt(0.0001) * 2**96));
  await (await pool.initialize(sqrtPriceX96, { gasLimit: 500000 })).wait();
  console.log('   ✅ Initialized');
  
  // Step 3: Wrap LYX to WLYX1
  console.log('3. Wrapping LYX to WLYX1...');
  const wlyx = new ethers.Contract(WLYX1, WLYX_ABI, wallet);
  await (await wlyx.deposit({ value: ethers.parseEther('2'), gasLimit: 100000 })).wait();
  console.log('   ✅ Wrapped 2 LYX');
  
  // Step 4: Authorize and approve
  console.log('4. Authorizing PM...');
  const agentpo = new ethers.Contract(AGENTPO, LSP7_ABI, wallet);
  await (await agentpo.authorizeOperator(PM, ethers.parseEther('100000'), '0x', { gasLimit: 200000 })).wait();
  await (await wlyx.approve(PM, ethers.parseEther('2'), { gasLimit: 100000 })).wait();
  console.log('   ✅ Done');
  
  // Step 5: Add liquidity
  console.log('5. Adding liquidity...');
  const pm = new ethers.Contract(PM, PM_ABI, wallet);
  const params = [
    AGENTPO, WLYX1, 3000, -887220, 887220,
    ethers.parseEther('50000'), ethers.parseEther('5'),
    0, 0, CONTROLLER, Math.floor(Date.now() / 1000) + 3600
  ];
  
  const tx5 = await pm.mint(params, { gasLimit: 3000000 });
  console.log('   Tx:', tx5.hash);
  
  const receipt5 = await tx5.wait();
  
  if (receipt5.status === 1) {
    console.log('\n🎉 SUCCESS! Pool created and liquidity added!');
    console.log('Pool:', poolAddress);
    console.log('Tx:', tx5.hash);
  } else {
    console.log('\n❌ Failed');
  }
}

setupPool().catch(err => console.error('❌', err.message));