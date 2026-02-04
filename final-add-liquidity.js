const { ethers } = require('ethers');
const fs = require('fs');

const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const WLYX = '0x6b6F4cb50e67adb082300b90Af49AF499D41d04E';
const PM = '0x855bb3e40261a73dd4fc691fc024cc7d60794d00';

const PM_ABI = ['function mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)'];
const LSP7_ABI = ['function authorizeOperator(address operator, uint256 amount, bytes memory operatorNotificationData)'];
const WLYX_ABI = ['function approve(address spender, uint256 amount) returns (bool)'];

async function addLiquidity() {
  console.log('💧 Adding Liquidity to AGENTPO/WLYX Pool\n');
  
  // Check balances
  const lyx = await provider.getBalance(CONTROLLER);
  console.log('LYX:', ethers.formatEther(lyx));
  
  // Authorize PM for AGENTPO
  console.log('\n1. Authorizing PM for AGENTPO...');
  const agentpo = new ethers.Contract(AGENTPO, LSP7_ABI, wallet);
  await (await agentpo.authorizeOperator(PM, ethers.parseEther('100'), '0x', { gasLimit: 200000 })).wait();
  console.log('   ✅ Done');
  
  // Approve PM for WLYX
  console.log('2. Approving PM for WLYX...');
  const wlyx = new ethers.Contract(WLYX, WLYX_ABI, wallet);
  await (await wlyx.approve(PM, ethers.parseEther('0.1'), { gasLimit: 100000 })).wait();
  console.log('   ✅ Done');
  
  // Mint position
  console.log('3. Minting position...');
  const pm = new ethers.Contract(PM, PM_ABI, wallet);
  
  const params = [
    AGENTPO, WLYX, 3000, -887220, 887220,
    ethers.parseEther('50'), ethers.parseEther('0.05'),
    0, 0, CONTROLLER, Math.floor(Date.now() / 1000) + 3600
  ];
  
  const tx = await pm.mint(params, { gasLimit: 3000000 });
  console.log('   Tx:', tx.hash);
  
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log('\n✅ LIQUIDITY ADDED!');
    console.log('Gas:', receipt.gasUsed.toString());
    console.log('https://explorer.execution.mainnet.lukso.network/tx/' + tx.hash);
    
    // Find NFT token ID
    for (const log of receipt.logs) {
      if (log.topics[0] === ethers.id('Transfer(address,address,uint256)')) {
        console.log('NFT Token ID:', BigInt(log.topics[3]).toString());
      }
    }
  } else {
    console.log('\n❌ Failed');
  }
}

addLiquidity().catch(err => console.error('❌', err.message));