const { ethers } = require('ethers');
const fs = require('fs');

const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const WLYX = '0x6b6F4cb50e67adb082300b90Af49AF499D41d04E';

// Position Manager (from Jordy's tx)
const POSITION_MANAGER = '0x855bb3e40261a73dd4fc691fc024cc7d60794d00';

const PM_ABI = [
  'function mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function WETH9() view returns (address)',
  'function factory() view returns (address)'
];

const UP_ABI = [
  'function execute(uint256 operation, address to, uint256 value, bytes calldata data) returns (bytes memory)'
];

const KEY_MANAGER_ABI = [
  'function execute(bytes calldata payload) returns (bytes memory)'
];

const LSP7_ABI = [
  'function authorizeOperator(address operator, uint256 amount, bytes memory operatorNotificationData)',
  'function balanceOf(address tokenOwner) view returns (uint256)'
];

async function addLiquidityViaPositionManager() {
  console.log('💧 Adding Liquidity via Position Manager (V3 Style)\n');
  
  // Check AGENTPO balance on controller
  const agentpo = new ethers.Contract(AGENTPO, LSP7_ABI, provider);
  const controller = '0xE093A714960da1bF297522617BfC08132b62B86a';
  const balance = await agentpo.balanceOf(controller);
  console.log('Controller AGENTPO balance:', ethers.formatEther(balance));
  
  if (balance < ethers.parseEther('100')) {
    console.log('❌ Not enough AGENTPO on controller');
    return;
  }
  
  // Step 1: Authorize Position Manager
  console.log('\nStep 1: Authorizing Position Manager...');
  const agentpoWithWallet = new ethers.Contract(AGENTPO, LSP7_ABI, wallet);
  const authTx = await agentpoWithWallet.authorizeOperator(
    POSITION_MANAGER,
    ethers.parseEther('100'),
    '0x',
    { gasLimit: 200000 }
  );
  console.log('  Auth tx:', authTx.hash);
  await authTx.wait();
  console.log('  ✅ Position Manager authorized');
  
  // Step 2: Wrap LYX to WLYX first
  console.log('\nStep 2: Wrapping LYX to WLYX...');
  const wlyxAbi = ['function deposit() payable'];
  const wlyx = new ethers.Contract(WLYX, wlyxAbi, wallet);
  const wrapTx = await wlyx.deposit({ value: ethers.parseEther('0.1'), gasLimit: 100000 });
  console.log('  Wrap tx:', wrapTx.hash);
  await wrapTx.wait();
  console.log('  ✅ LYX wrapped');
  
  // Step 3: Mint position
  console.log('\nStep 3: Minting position...');
  
  const pm = new ethers.Contract(POSITION_MANAGER, PM_ABI, provider);
  
  // Create mint parameters (simplified - full range for now)
  const mintParams = {
    token0: AGENTPO.toLowerCase() < WLYX.toLowerCase() ? AGENTPO : WLYX,
    token1: AGENTPO.toLowerCase() < WLYX.toLowerCase() ? WLYX : AGENTPO,
    fee: 3000, // 0.3%
    tickLower: -887220, // Min tick (full range)
    tickUpper: 887220,  // Max tick (full range)
    amount0Desired: ethers.parseEther('50'), // 50 AGENTPO
    amount1Desired: ethers.parseEther('0.05'), // 0.05 WLYX
    amount0Min: 0,
    amount1Min: 0,
    recipient: UP_ADDRESS,
    deadline: Math.floor(Date.now() / 1000) + 3600
  };
  
  console.log('  Mint params:');
  console.log('    Token0:', mintParams.token0);
  console.log('    Token1:', mintParams.token1);
  console.log('    Fee:', mintParams.fee);
  console.log('    Amount0:', ethers.formatEther(mintParams.amount0Desired));
  console.log('    Amount1:', ethers.formatEther(mintParams.amount1Desired));
  
  const mintData = pm.interface.encodeFunctionData('mint', [mintParams]);
  
  // Execute via UP
  const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
  const upExecuteData = up.interface.encodeFunctionData('execute', [
    0,
    POSITION_MANAGER,
    0,
    mintData
  ]);
  
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  console.log('\n  Sending transaction...');
  const tx = await keyManager.execute(upExecuteData, { gasLimit: 2000000 });
  console.log('  Tx:', tx.hash);
  
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log('\n  ✅ SUCCESS! Liquidity added!');
    console.log('  Gas used:', receipt.gasUsed.toString());
    
    // Find token ID
    const transferTopic = ethers.id('Transfer(address,address,uint256)');
    const transferEvent = receipt.logs.find(log => log.topics[0] === transferTopic);
    if (transferEvent) {
      const tokenId = BigInt(transferEvent.topics[3]);
      console.log('  NFT Token ID:', tokenId.toString());
    }
  } else {
    console.log('\n  ❌ Failed');
  }
}

addLiquidityViaPositionManager().catch(err => {
  console.error('❌ Error:', err.message);
});