const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const POTATO_TIPPER = '0x5eed04004c2D46C12Fe30C639A90AD5d6F5D573d';
const POTATO_TOKEN = '0x2b2ea1416d63abf7e3c3657f03806f015625524b';

const LSP1_FOLLOW_KEY = '0x0cfc51aec37c55a4d0b1000071e02f9f05bcd5816ec4f3134aa2e5a916669537';
const LSP1_UNFOLLOW_KEY = '0x0cfc51aec37c55a4d0b100009d3c0b4012b69658977b099bdaa51eff0f0460f4';
const SETTINGS_KEY = '0xd1d57abed02d4c2d7ce00000e8211998bb257be214c7b0997830cd295066cc6a';

async function execute() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('Controller:', wallet.address);
  console.log('UP:', MY_UP);
  
  // Build setDataBatch payload
  const tipAmount = ethers.parseUnits('10', 18);
  const minFollowers = 3;
  const minPotato = ethers.parseUnits('10', 18);
  
  const abiCoder = new ethers.AbiCoder();
  const settingsValue = abiCoder.encode(['uint256', 'uint256', 'uint256'], [tipAmount, minFollowers, minPotato]);
  
  // FIX: Don't pad the address - use raw 20 bytes
  const potatoTipperAddress = POTATO_TIPPER.toLowerCase(); // Just the address, no padding
  
  const dataKeys = [LSP1_FOLLOW_KEY, LSP1_UNFOLLOW_KEY, SETTINGS_KEY];
  const dataValues = [
    potatoTipperAddress, // 20 bytes, not padded
    potatoTipperAddress, // 20 bytes, not padded
    settingsValue        // ABI encoded tuple
  ];
  
  console.log('\nData values:');
  console.log('Follow delegate:', dataValues[0], '(length:', dataValues[0].length, ')');
  console.log('Unfollow delegate:', dataValues[1], '(length:', dataValues[1].length, ')');
  console.log('Settings:', dataValues[2].slice(0, 50) + '...', '(length:', dataValues[2].length, ')');
  
  // Encode setDataBatch call on UP
  const upInterface = new ethers.Interface([
    'function setDataBatch(bytes32[] calldata dataKeys, bytes[] calldata dataValues) external'
  ]);
  const setDataCalldata = upInterface.encodeFunctionData('setDataBatch', [dataKeys, dataValues]);
  
  console.log('\nStep 1: setDataBatch payload');
  console.log(setDataCalldata.slice(0, 100) + '...');
  
  // Execute via KeyManager
  const keyManagerAbi = ['function execute(bytes calldata payload) external payable returns (bytes memory)'];
  const keyManager = new ethers.Contract(KEY_MANAGER, keyManagerAbi, wallet);
  
  try {
    console.log('Sending transaction...');
    const tx1 = await keyManager.execute(setDataCalldata, { gasLimit: 500000 });
    console.log('TX sent:', tx1.hash);
    const receipt1 = await tx1.wait();
    console.log('✅ Step 1 confirmed, gas used:', receipt1.gasUsed.toString());
  } catch (e) {
    console.error('Step 1 error:', e.message);
    return;
  }
  
  // Step 2: Authorize operator
  console.log('\nStep 2: Authorize PotatoTipper as operator');
  const lsp7Interface = new ethers.Interface([
    'function authorizeOperator(address operator, uint256 amount, bytes calldata data) external'
  ]);
  const budget = ethers.parseUnits('500', 18);
  const authCalldata = lsp7Interface.encodeFunctionData('authorizeOperator', [POTATO_TIPPER, budget, '0x']);
  
  try {
    const tx2 = await keyManager.execute(authCalldata, { gasLimit: 300000 });
    console.log('TX sent:', tx2.hash);
    const receipt2 = await tx2.wait();
    console.log('✅ Step 2 confirmed, gas used:', receipt2.gasUsed.toString());
  } catch (e) {
    console.error('Step 2 error:', e.message);
    return;
  }
  
  console.log('\n🥔 POTATO TIPPER SETUP COMPLETE!');
  console.log('New followers will receive 10 POTATO tokens automatically.');
}

execute().catch(console.error);