const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const POTATO_TIPPER = '0x5eed04004c2D46C12Fe30C639A90AD5d6F5D573d';

const LSP1_FOLLOW_KEY = '0x0cfc51aec37c55a4d0b1000071e02f9f05bcd5816ec4f3134aa2e5a916669537';
const LSP1_UNFOLLOW_KEY = '0x0cfc51aec37c55a4d0b100009d3c0b4012b69658977b099bdaa51eff0f0460f4';
const SETTINGS_KEY = '0xd1d57abed02d4c2d7ce00000e8211998bb257be214c7b0997830cd295066cc6a';

async function execute() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('Controller:', wallet.address);
  
  // Build setDataBatch
  const tipAmount = ethers.parseUnits('10', 18);
  const minFollowers = 3;
  const minPotato = ethers.parseUnits('10', 18);
  
  const abiCoder = new ethers.AbiCoder();
  const settingsValue = abiCoder.encode(['uint256', 'uint256', 'uint256'], [tipAmount, minFollowers, minPotato]);
  
  const dataKeys = [LSP1_FOLLOW_KEY, LSP1_UNFOLLOW_KEY, SETTINGS_KEY];
  const dataValues = [
    POTATO_TIPPER.toLowerCase(),
    POTATO_TIPPER.toLowerCase(),
    settingsValue
  ];
  
  const upInterface = new ethers.Interface([
    'function setDataBatch(bytes32[] calldata dataKeys, bytes[] calldata dataValues) external'
  ]);
  const setDataCalldata = upInterface.encodeFunctionData('setDataBatch', [dataKeys, dataValues]);
  
  console.log('Payload:', setDataCalldata.slice(0, 80) + '...');
  
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  try {
    console.log('Sending...');
    const tx = await keyManager.execute(setDataCalldata, { gasLimit: 500000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ SUCCESS! Gas used:', receipt.gasUsed.toString());
  } catch (e) {
    console.error('❌ FAILED:', e.message);
    if (e.data) console.log('Revert data:', e.data);
    
    // Try to decode error
    if (e.data && e.data !== '0x') {
      try {
        const errorInterface = new ethers.Interface([
          'error NoPermissionsSet(address)',
          'error NotAuthorised(address, string)',
          'error InvalidPayload()'
        ]);
        const decoded = errorInterface.parseError(e.data);
        console.log('Decoded error:', decoded);
      } catch (e2) {
        console.log('Could not decode error');
      }
    }
  }
}

execute();