const { ethers } = require('ethers');

// Configuration
const LSP26_ADDRESS = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const TARGET_ADDRESS = '0x541e81180b8bc7ddF10DcCEC3dFa7ed278caC316';
const RPC_URL = 'https://rpc.mainnet.lukso.network';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_4';

// Minimal ABIs
const LSP0_ABI = [
  'function execute(uint256 operation, address to, uint256 value, bytes calldata data) external returns(bytes)',
  'function owner() external view returns (address)'
];

const LSP6_ABI = [
  'function execute(bytes calldata payload) external payable returns (bytes)'
];

const LSP26_ABI = [
  'function follow(address target) external',
  'function isFollowing(address follower, address target) external view returns (bool)'
];

async function followUP() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('Following UP:', TARGET_ADDRESS);
    console.log('My UP:', UP_ADDRESS);
    
    // Get KeyManager address
    const upContract = new ethers.Contract(UP_ADDRESS, LSP0_ABI, provider);
    const keyManagerAddress = await upContract.owner();
    console.log('KeyManager:', keyManagerAddress);
    
    // Encode follow call
    const lsp26Contract = new ethers.Contract(LSP26_ADDRESS, LSP26_ABI, provider);
    const followCalldata = lsp26Contract.interface.encodeFunctionData('follow', [TARGET_ADDRESS]);
    
    // Encode UP.execute(0, LSP26, 0, followCalldata)
    const upExecuteCalldata = upContract.interface.encodeFunctionData('execute', [
      0, // operation: CALL
      LSP26_ADDRESS,
      0, // value
      followCalldata
    ]);
    
    // Execute via KeyManager
    const keyManager = new ethers.Contract(keyManagerAddress, LSP6_ABI, signer);
    
    console.log('Sending transaction...');
    const tx = await keyManager.execute(upExecuteCalldata);
    console.log('Transaction hash:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Confirmed in block:', receipt.blockNumber);
    
    // Check follow status
    const isFollowing = await lsp26Contract.isFollowing(UP_ADDRESS, TARGET_ADDRESS);
    console.log('Following status:', isFollowing ? '✅ Following' : '❌ Not following');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

followUP();
