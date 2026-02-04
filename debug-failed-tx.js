const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TX_HASH = '0x6c9232383135c59db697190908371d89db5e140fb2b73de9c3dea9f59993ea90';
const AGENTPO = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const ROUTER = '0xA46d16FB9F228785cF1A7C20415bb5AfC193945A';

async function debug() {
  console.log('🔍 Debugging Failed Transaction\n');
  
  const tx = await provider.getTransaction(TX_HASH);
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  
  console.log('Transaction:');
  console.log('  From:', tx.from);
  console.log('  To:', tx.to);
  console.log('  Value:', ethers.formatEther(tx.value), 'LYX');
  console.log('  Gas Limit:', tx.gasLimit.toString());
  console.log('  Gas Used:', receipt.gasUsed.toString());
  console.log('  Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('');
  
  // Decode the input data
  const data = tx.data;
  const selector = data.slice(0, 10);
  console.log('Function Selector:', selector);
  
  // Known selectors
  const selectors = {
    '0x09c5eabe': 'KeyManager.execute(bytes)',
    '0xf305d719': 'Router.addLiquidityETH()',
    '0xc9c65396': 'Factory.createPair()',
    '0x44c028fe': 'UniversalProfile.execute()'
  };
  
  console.log('Function:', selectors[selector] || 'Unknown');
  console.log('');
  
  // Check if controller is authorized for AGENTPO
  const lsp7Abi = [
    'function authorizedAmountFor(address operator, address tokenOwner) view returns (uint256)'
  ];
  
  const agentpo = new ethers.Contract(AGENTPO, lsp7Abi, provider);
  
  try {
    const authAmount = await agentpo.authorizedAmountFor(ROUTER, CONTROLLER);
    console.log('Router authorized amount for Controller:', ethers.formatEther(authAmount));
    
    if (authAmount < ethers.parseEther('100000')) {
      console.log('❌ Router not sufficiently authorized!');
    } else {
      console.log('✅ Router is authorized');
    }
  } catch (e) {
    console.log('Error checking authorization:', e.message);
  }
  
  // Check controller AGENTPO balance
  const lsp7BalanceAbi = ['function balanceOf(address) view returns (uint256)'];
  const agentpo2 = new ethers.Contract(AGENTPO, lsp7BalanceAbi, provider);
  
  try {
    const balance = await agentpo2.balanceOf(CONTROLLER);
    console.log('\nController AGENTPO balance:', ethers.formatEther(balance));
  } catch (e) {
    console.log('Error checking balance:', e.message);
  }
  
  console.log('\n📝 Learning from GitHub:');
  console.log('- TransferHelper.safeTransferFrom calls ILSP7DigitalAsset.transfer()');
  console.log('- It uses: transfer(from, to, value, true, "")');
  console.log('- The force=true allows transfer to any address');
  console.log('- Our setup looks correct, but something else is failing');
}

debug();