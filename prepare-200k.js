const { ethers } = require('ethers');
const fs = require('fs');

const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const WLYX1 = '0x2dB41674F2b882889e5E1Bd09a3f3613952bC472';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const PM = '0x855bb3e40261a73dd4fc691fc024cc7d60794d00';

const WLYX_ABI = ['function deposit() payable', 'function balanceOf(address) view returns (uint256)', 'function approve(address,uint256) returns (bool)'];
const LSP7_ABI = ['function authorizeOperator(address operator, uint256 amount, bytes memory operatorNotificationData)'];

async function prepareForLiquidity() {
  console.log('💰 Preparing 200K Liquidity Setup\n');
  
  // Check current balances
  const lyx = await provider.getBalance(CONTROLLER);
  console.log('Controller LYX:', ethers.formatEther(lyx));
  
  const wlyx = new ethers.Contract(WLYX1, WLYX_ABI, wallet);
  const wlyxBalance = await wlyx.balanceOf(CONTROLLER);
  console.log('Controller WLYX1:', ethers.formatEther(wlyxBalance));
  
  // Wrap available LYX (keep 1 LYX for gas)
  const availableLYX = lyx - ethers.parseEther('1'); // Keep 1 LYX for gas
  if (availableLYX > 0) {
    console.log('\n1. Wrapping', ethers.formatEther(availableLYX), 'LYX to WLYX1...');
    await (await wlyx.deposit({ value: availableLYX, gasLimit: 100000 })).wait();
    console.log('   ✅ Wrapped');
  }
  
  // Approve WLYX1 for Position Manager
  console.log('2. Approving WLYX1 for Position Manager...');
  await (await wlyx.approve(PM, ethers.parseEther('25'), { gasLimit: 100000 })).wait();
  console.log('   ✅ Approved');
  
  // Authorize PM for 200k AGENTPO
  console.log('3. Authorizing PM for 200000 AGENTPO...');
  const agentpo = new ethers.Contract(AGENTPO, LSP7_ABI, wallet);
  await (await agentpo.authorizeOperator(PM, ethers.parseEther('200000'), '0x', { gasLimit: 200000 })).wait();
  console.log('   ✅ Authorized');
  
  // Check final balances
  const finalWLYX = await wlyx.balanceOf(CONTROLLER);
  console.log('\n✅ Ready for liquidity!');
  console.log('   AGENTPO: 200000 (authorized)');
  console.log('   WLYX1:', ethers.formatEther(finalWLYX));
  console.log('');
  console.log('Add liquidity at:');
  console.log('https://universalswaps.io/add/0x47568bc4dc7fee1bb67f741ba927e2904b61f016');
  console.log('');
  console.log('Suggested ratio for easy buying:');
  console.log('   200000 AGENTPO : 15-20 WLYX');
  console.log('   Price: ~0.000075-0.0001 WLYX per AGENTPO');
}

prepareForLiquidity().catch(err => console.error('❌', err.message));