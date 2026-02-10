const { ethers } = require('ethers');

// My UP and Controller
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';

// Contracts
const POTATO_TIPPER = '0x5eed04004c2D46C12Fe30C639A90AD5d6F5D573d';
const POTATO_TOKEN = '0x2b2ea1416d63abf7e3c3657f03806f015625524b';

// Data Keys
const LSP1_FOLLOW_KEY = '0x0cfc51aec37c55a4d0b1000071e02f9f05bcd5816ec4f3134aa2e5a916669537';
const LSP1_UNFOLLOW_KEY = '0x0cfc51aec37c55a4d0b100009d3c0b4012b69658977b099bdaa51eff0f0460f4';
const SETTINGS_KEY = '0xd1d57abed02d4c2d7ce00000e8211998bb257be214c7b0997830cd295066cc6a';

// Try multiple RPCs
const RPC_URLS = [
  'https://42.rpc.thirdweb.com',
  'https://rpc.mainnet.lukso.network',
  'https://lukso.rpc.thirdweb.com'
];

async function executeSetup() {
  console.log('🥔 EXECUTING POTATO TIPPER SETUP');
  console.log('=================================\n');
  
  let provider;
  for (const url of RPC_URLS) {
    try {
      console.log('Trying RPC:', url);
      provider = new ethers.JsonRpcProvider(url);
      await provider.getBlockNumber();
      console.log('✅ Connected\n');
      break;
    } catch (e) {
      console.log('❌ Failed:', e.message);
    }
  }
  
  if (!provider) {
    console.error('No working RPC found');
    return;
  }
  
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log('Controller:', wallet.address);
  console.log('UP:', MY_UP);
  console.log('');
  
  // Encode settings: (tipAmount, minimumFollowers, minimumPotatoBalance)
  const tipAmount = ethers.parseUnits('10', 18); // 10 POTATO
  const minFollowers = 3;
  const minPotatoBalance = ethers.parseUnits('10', 18); // 10 POTATO
  
  const abiCoder = new ethers.AbiCoder();
  const settingsValue = abiCoder.encode(['uint256', 'uint256', 'uint256'], [tipAmount, minFollowers, minPotatoBalance]);
  
  // KeyManager ABI
  const keyManagerAbi = [
    'function execute(bytes calldata payload) external payable returns (bytes memory)',
    'function getNonce(address _address, uint256 _channel) external view returns (uint256)',
    'function getData(bytes32 dataKey) external view returns (bytes memory)'
  ];
  
  const keyManager = new ethers.Contract(KEY_MANAGER, keyManagerAbi, wallet);
  
  // Check permissions first
  console.log('Checking permissions...');
  try {
    // Get nonce
    const nonce = await keyManager.getNonce(wallet.address, 0);
    console.log('Nonce:', nonce.toString());
  } catch (e) {
    console.log('Note:', e.message);
  }
  
  // Step 1: Set data keys via KeyManager
  console.log('\n📋 STEP 1: Set LSP1 Delegates and Settings');
  
  // UP interface for setDataBatch
  const upInterface = new ethers.Interface([
    'function setDataBatch(bytes32[] calldata dataKeys, bytes[] calldata dataValues) external'
  ]);
  
  const dataKeys = [LSP1_FOLLOW_KEY, LSP1_UNFOLLOW_KEY, SETTINGS_KEY];
  const dataValues = [
    '0x5eed04004c2d46c12fe30c639a90ad5d6f5d573d',
    '0x5eed04004c2d46c12fe30c639a90ad5d6f5d573d',
    settingsValue
  ];
  
  const setDataPayload = upInterface.encodeFunctionData('setDataBatch', [dataKeys, dataValues]);
  console.log('Payload:', setDataPayload.slice(0, 100) + '...');
  
  // This would be the actual execution - commented out for safety review
  console.log('\n⚠️  Transaction ready to execute:');
  console.log('To:', KEY_MANAGER);
  console.log('Payload length:', setDataPayload.length, 'chars');
  console.log('');
  console.log('Execute with:');
  console.log('await keyManager.execute("' + setDataPayload + '");');
  
  // Step 2: Authorize operator
  console.log('\n📋 STEP 2: Authorize PotatoTipper as POTATO Operator');
  const potatoInterface = new ethers.Interface([
    'function authorizeOperator(address operator, uint256 amount, bytes calldata data) external'
  ]);
  const budget = ethers.parseUnits('500', 18); // 500 POTATO budget
  const authPayload = potatoInterface.encodeFunctionData('authorizeOperator', [
    POTATO_TIPPER,
    budget,
    '0x'
  ]);
  console.log('Authorize payload:', authPayload);
  
  console.log('\n✅ Setup prepared. Ready to execute transactions.');
  console.log('\nSummary:');
  console.log('- Tip amount: 10 POTATO');
  console.log('- Min followers: 3');
  console.log('- Min POTATO balance: 10 POTATO');
  console.log('- Budget: 500 POTATO');
}

executeSetup().catch(console.error);