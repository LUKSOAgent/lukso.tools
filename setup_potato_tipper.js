const { ethers } = require('ethers');

// My UP and Controller
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CONTROLLER_KEY = '0xE093A714960da1bF297522617BfC08132b62B86a';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';

// Contracts
const POTATO_TIPPER = '0x5eed04004c2D46C12Fe30C639A90AD5d6F5D573d';
const POTATO_TOKEN = '0x2b2ea1416d63abf7e3c3657f03806f015625524b';

// Data Keys
const LSP1_FOLLOW_KEY = '0x0cfc51aec37c55a4d0b1000071e02f9f05bcd5816ec4f3134aa2e5a916669537';
const LSP1_UNFOLLOW_KEY = '0x0cfc51aec37c55a4d0b100009d3c0b4012b69658977b099bdaa51eff0f0460f4';
const SETTINGS_KEY = '0xd1d57abed02d4c2d7ce00000e8211998bb257be214c7b0997830cd295066cc6a';

// RPC
const RPC_URL = 'https://42.rpc.thirdweb.com';

async function setupPotatoTipper() {
  console.log('🥔 SETTING UP POTATO TIPPER');
  console.log('===========================\n');
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('Controller:', wallet.address);
    console.log('UP:', MY_UP);
    console.log('');
    
    // Encode settings: (tipAmount, minimumFollowers, minimumPotatoBalance)
    // 10 POTATO, 3 followers, 10 POTATO balance
    const tipAmount = ethers.parseUnits('10', 18); // 10 POTATO
    const minFollowers = 3;
    const minPotatoBalance = ethers.parseUnits('10', 18); // 10 POTATO
    
    const abiCoder = new ethers.AbiCoder();
    const settingsValue = abiCoder.encode(['uint256', 'uint256', 'uint256'], [tipAmount, minFollowers, minPotatoBalance]);
    
    console.log('Settings encoded:', settingsValue);
    console.log('');
    
    // KeyManager ABI for execute
    const keyManagerAbi = [
      'function execute(bytes calldata payload) external payable returns (bytes memory)',
      'function getNonce(address _address, uint256 _channel) external view returns (uint256)'
    ];
    
    const keyManager = new ethers.Contract(KEY_MANAGER, keyManagerAbi, wallet);
    
    // UP ABI for setDataBatch
    const upAbi = [
      'function setDataBatch(bytes32[] calldata dataKeys, bytes[] calldata dataValues) external'
    ];
    
    // Prepare data keys and values
    const dataKeys = [
      LSP1_FOLLOW_KEY,
      LSP1_UNFOLLOW_KEY,
      SETTINGS_KEY
    ];
    
    const dataValues = [
      POTATO_TIPPER, // address for follow
      POTATO_TIPPER, // address for unfollow
      settingsValue  // encoded settings
    ];
    
    // Encode setDataBatch call
    const upInterface = new ethers.Interface(upAbi);
    const setDataPayload = upInterface.encodeFunctionData('setDataBatch', [dataKeys, dataValues]);
    
    console.log('Payload to execute:', setDataPayload);
    console.log('');
    
    // For now, just log the transaction details
    // In production, would call keyManager.execute with proper permissions
    console.log('Data keys to set:');
    console.log('1. LSP1 Follow Delegate:', LSP1_FOLLOW_KEY, '->', POTATO_TIPPER);
    console.log('2. LSP1 Unfollow Delegate:', LSP1_UNFOLLOW_KEY, '->', POTATO_TIPPER);
    console.log('3. Settings:', SETTINGS_KEY, '->', settingsValue);
    console.log('');
    
    console.log('Next: Authorize PotatoTipper as POTATO operator with 500 POTATO allowance');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

setupPotatoTipper();