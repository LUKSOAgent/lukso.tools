const ethers = require('ethers');

// Configuration
const RPC_URL = 'https://mainnet.base.org';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_2';
const WALLET_ADDRESS = '0x899C7642802E294857b19754a2377F8e74dA9319';
const TARGET_ADDRESS = '0x820CB7D79A15a66Cb0247fB3d5a9AC2f1644938B';
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('Transferring all USDC to target address...');
  
  const usdcContract = new ethers.Contract(USDC, ERC20_ABI, wallet);
  const usdcBalance = await usdcContract.balanceOf(WALLET_ADDRESS);
  const usdcDecimals = await usdcContract.decimals();
  const usdcAmount = ethers.formatUnits(usdcBalance, usdcDecimals);
  
  console.log(`USDC Balance: ${usdcAmount} USDC`);
  console.log(`Target: ${TARGET_ADDRESS}`);
  
  const transferTx = await usdcContract.transfer(TARGET_ADDRESS, usdcBalance);
  console.log(`Transfer tx sent: ${transferTx.hash}`);
  const transferReceipt = await transferTx.wait();
  console.log(`✅ Transfer confirmed in block ${transferReceipt.blockNumber}`);
  
  console.log('');
  console.log('='.repeat(60));
  console.log('FINAL REPORT');
  console.log('='.repeat(60));
  console.log(`Swap Transaction Hash: 0x0cb80112281db2e9b6ed2eb9a6b3ca401e10c342b5a5391750fe6f9886c07b21`);
  console.log(`USDC Amount Received: 502.827065 USDC`);
  console.log(`Transfer Transaction Hash: ${transferTx.hash}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
