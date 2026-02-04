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
const POSITION_MANAGER = '0x855bb3e40261a73dd4fc691fc024cc7d60794d00';

const PM_ABI = ['function mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)'];
const UP_ABI = ['function execute(uint256 operation, address to, uint256 value, bytes calldata data) returns (bytes memory)'];
const KEY_MANAGER_ABI = ['function execute(bytes calldata payload) returns (bytes memory)'];

async function mintPosition() {
  console.log('🚀 Quick Mint Position\n');
  
  const pm = new ethers.Contract(POSITION_MANAGER, PM_ABI, provider);
  const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);
  
  // Parameters as array in correct order
  const token0 = AGENTPO.toLowerCase() < WLYX.toLowerCase() ? AGENTPO : WLYX;
  const token1 = AGENTPO.toLowerCase() < WLYX.toLowerCase() ? WLYX : AGENTPO;
  const fee = 3000;
  const tickLower = -887220;
  const tickUpper = 887220;
  const amount0Desired = ethers.parseEther('50');
  const amount1Desired = ethers.parseEther('0.05');
  const amount0Min = 0;
  const amount1Min = 0;
  const recipient = UP_ADDRESS;
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  
  console.log('Minting with:');
  console.log('  Token0:', token0);
  console.log('  Token1:', token1);
  console.log('  Amount0:', ethers.formatEther(amount0Desired));
  console.log('  Amount1:', ethers.formatEther(amount1Desired));
  console.log('');
  
  // Encode as tuple
  const mintData = pm.interface.encodeFunctionData('mint', [[
    token0, token1, fee, tickLower, tickUpper,
    amount0Desired, amount1Desired, amount0Min, amount1Min,
    recipient, deadline
  ]]);
  
  const upExecuteData = up.interface.encodeFunctionData('execute', [0, POSITION_MANAGER, 0, mintData]);
  
  console.log('Sending...');
  const tx = await keyManager.execute(upExecuteData, { gasLimit: 3000000 });
  console.log('Tx:', tx.hash);
  
  const receipt = await tx.wait();
  console.log(receipt.status === 1 ? '\n✅ SUCCESS!' : '\n❌ Failed');
  console.log('Gas:', receipt.gasUsed.toString());
  
  if (receipt.status === 1) {
    console.log('\n🎉 LIQUIDITY ADDED!');
    console.log('https://explorer.execution.mainnet.lukso.network/tx/' + tx.hash);
  }
}

mintPosition().catch(err => console.error('❌', err.message));