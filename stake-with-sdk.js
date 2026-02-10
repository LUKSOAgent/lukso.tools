const { StakeWiseSDK, Network } = require('@stakewise/v3-sdk');
const { ethers } = require('ethers');

const EOA_PK = '0xREDACTED_PRIVATE_KEY_2';
const EOA = '0x899C7642802E294857b19754a2377F8e74dA9319';
const VAULT = '0x8A93A876912c9F03F88Bc9114847cf5b63c89f56';

async function stakeWithSDK() {
  console.log('Initializing StakeWise SDK...\n');
  
  const sdk = new StakeWiseSDK({
    network: Network.Mainnet,
    endpoints: {
      web3: ['https://eth.llamarpc.com']
    }
  });
  
  console.log('SDK initialized');
  console.log('Vault:', VAULT);
  console.log('User:', EOA);
  console.log('Amount: 0.01 ETH\n');
  
  // Create provider with private key
  const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
  const wallet = new ethers.Wallet(EOA_PK, provider);
  
  // Get deposit parameters
  console.log('Getting deposit parameters...');
  const params = await sdk.vault.deposit.encode({
    assets: ethers.parseEther('0.01'),
    userAddress: EOA,
    vaultAddress: VAULT,
  });
  
  console.log('Deposit params:');
  console.log('  To:', params.to);
  console.log('  Value:', ethers.formatEther(params.value), 'ETH');
  console.log('  Data:', params.data.substring(0, 100) + '...\n');
  
  // Send transaction directly
  console.log('Sending transaction...');
  const tx = await wallet.sendTransaction({
    to: params.to,
    value: params.value,
    data: params.data,
    gasLimit: 500000
  });
  
  console.log('Transaction sent:', tx.hash);
  console.log('Waiting for confirmation...\n');
  
  const receipt = await tx.wait();
  console.log('✅ Confirmed in block:', receipt.blockNumber);
  
  // Check shares
  console.log('\nChecking shares...');
  const shares = await sdk.vault.getUserShares({
    userAddress: EOA,
    vaultAddress: VAULT,
  });
  
  console.log('Shares:', shares.toString());
  
  console.log('\n🎉 Successfully staked 0.01 ETH!');
}

stakeWithSDK().catch(console.error);
