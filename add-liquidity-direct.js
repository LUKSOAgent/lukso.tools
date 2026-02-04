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
const POSITION_MANAGER = '0x855bb3e40261a73dd4fc691fc024cc7d60794d00';

const PM_ABI = ['function mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)'];
const WLYX_ABI = ['function deposit() payable', 'function balanceOf(address) view returns (uint256)', 'function approve(address,uint256) returns (bool)'];
const LSP7_ABI = ['function authorizeOperator(address operator, uint256 amount, bytes memory operatorNotificationData)', 'function balanceOf(address tokenOwner) view returns (uint256)'];

async function addLiquidityDirect() {
  console.log('💧 Adding Liquidity Direct from Controller\n');
  
  // Check balances
  const lyxBalance = await provider.getBalance(CONTROLLER);
  console.log('Controller LYX:', ethers.formatEther(lyxBalance));
  
  const agentpo = new ethers.Contract(AGENTPO, LSP7_ABI, wallet);
  const agentpoBalance = await agentpo.balanceOf(CONTROLLER);
  console.log('Controller AGENTPO:', ethers.formatEther(agentpoBalance));
  
  const wlyx = new ethers.Contract(WLYX, WLYX_ABI, wallet);
  const wlyxBalance = await wlyx.balanceOf(CONTROLLER);
  console.log('Controller WLYX:', ethers.formatEther(wlyxBalance));
  
  console.log('');
  
  // Check if PM is authorized for AGENTPO
  const authAbi = ['function authorizedAmountFor(address operator, address tokenOwner) view returns (uint256)'];
  const agentpoCheck = new ethers.Contract(AGENTPO, authAbi, provider);
  const authAmount = await agentpoCheck.authorizedAmountFor(POSITION_MANAGER, CONTROLLER);
  console.log('PM authorized for AGENTPO:', ethers.formatEther(authAmount));
  
  if (authAmount < ethers.parseEther('50')) {
    console.log('\nAuthorizing PM...');
    const authTx = await agentpo.authorizeOperator(POSITION_MANAGER, ethers.parseEther('100'), '0x', { gasLimit: 200000 });
    await authTx.wait();
    console.log('✅ Authorized');
  }
  
  // Wrap LYX if needed
  if (wlyxBalance < ethers.parseEther('0.05')) {
    console.log('\nWrapping LYX to WLYX...');
    const wrapTx = await wlyx.deposit({ value: ethers.parseEther('0.1'), gasLimit: 100000 });
    await wrapTx.wait();
    console.log('✅ Wrapped');
  }
  
  // Approve WLYX for PM
  console.log('\nApproving WLYX for PM...');
  const approveTx = await wlyx.approve(POSITION_MANAGER, ethers.parseEther('0.1'), { gasLimit: 100000 });
  await approveTx.wait();
  console.log('✅ Approved');
  
  // Now mint position directly
  console.log('\n🚀 Minting position...');
  
  const pm = new ethers.Contract(POSITION_MANAGER, PM_ABI, wallet);
  
  const token0 = AGENTPO.toLowerCase() < WLYX.toLowerCase() ? AGENTPO : WLYX;
  const token1 = AGENTPO.toLowerCase() < WLYX.toLowerCase() ? WLYX : AGENTPO;
  
  const mintParams = [
    token0, token1, 3000, -887220, 887220,
    ethers.parseEther('50'), ethers.parseEther('0.05'),
    0, 0, CONTROLLER, Math.floor(Date.now() / 1000) + 3600
  ];
  
  console.log('Params:');
  console.log('  Token0:', token0);
  console.log('  Token1:', token1);
  console.log('  AGENTPO amount:', 50);
  console.log('  WLYX amount:', 0.05);
  console.log('');
  
  const tx = await pm.mint(mintParams, { gasLimit: 3000000 });
  console.log('Tx sent:', tx.hash);
  console.log('Waiting...');
  
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log('\n✅ SUCCESS! LIQUIDITY ADDED!');
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('https://explorer.execution.mainnet.lukso.network/tx/' + tx.hash);
    
    // Find token ID
    for (const log of receipt.logs) {
      if (log.topics[0] === ethers.id('Transfer(address,address,uint256)')) {
        const tokenId = BigInt(log.topics[3]);
        console.log('NFT Token ID:', tokenId.toString());
      }
    }
  } else {
    console.log('\n❌ Failed');
  }
}

addLiquidityDirect().catch(err => {
  console.error('❌ Error:', err.message);
});