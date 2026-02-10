const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

const TX_HASH = '0x91d6f872b121188dc858c0179c52d569b3d6ef32179f7c3c2a85acf73f3d95e1';
const VAULT_ADDRESS = '0x8A93A876912c9F03F88Bc9114847cf5b63c89f56';

const VAULT_ABI = [
  "event Deposited(address indexed caller, address indexed receiver, uint256 assets, uint256 shares, address referrer)"
];

async function analyzeTx() {
  console.log('Analyzing transaction:', TX_HASH);
  
  const tx = await provider.getTransaction(TX_HASH);
  console.log('\nTransaction details:');
  console.log('From:', tx.from);
  console.log('To:', tx.to);
  console.log('Value:', ethers.formatEther(tx.value), 'ETH');
  console.log('Data:', tx.data);
  
  // Decode the input data
  const iface = new ethers.Interface([
    "function updateStateAndDeposit(address receiver, address referrer, tuple(bytes32 rewardsRoot, int160 totalAssetsDelta, uint160 unclaimedRewards, uint64 nonce, bytes proof) harvestParams) external payable returns (uint256 shares)"
  ]);
  
  try {
    const decoded = iface.decodeFunctionData('updateStateAndDeposit', tx.data);
    console.log('\nDecoded input:');
    console.log('Receiver:', decoded[0]);
    console.log('Referrer:', decoded[1]);
    console.log('Harvest params:');
    console.log('  rewardsRoot:', decoded[2].rewardsRoot);
    console.log('  totalAssetsDelta:', decoded[2].totalAssetsDelta.toString());
    console.log('  unclaimedRewards:', decoded[2].unclaimedRewards.toString());
    console.log('  nonce:', decoded[2].nonce.toString());
    console.log('  proof length:', decoded[2].proof.length, 'bytes');
    console.log('  proof:', decoded[2].proof.substring(0, 100) + '...');
  } catch (e) {
    console.log('Could not decode:', e.message);
  }
  
  // Get receipt
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  console.log('\nReceipt status:', receipt.status);
}

analyzeTx().catch(console.error);
