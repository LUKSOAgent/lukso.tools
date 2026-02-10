import { StakeWiseSDK, Network } from '@stakewise/v3-sdk';
import { ethers } from 'ethers';

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
  
  // Use SDK with the wallet
  const sdkWithSigner = new StakeWiseSDK({
    network: Network.Mainnet,
    endpoints: {
      web3: ['https://eth.llamarpc.com']
    },
    provider: wallet
  });
  
  console.log('Depositing via SDK...');
  
  try {
    // Deposit via SDK - it will handle the state update internally
    const hash = await sdkWithSigner.vault.deposit({
      assets: ethers.parseEther('0.01'),
      userAddress: EOA,
      vaultAddress: VAULT,
    });
    
    console.log('Transaction sent:', hash);
    console.log('Waiting for confirmation...\n');
    
    // Wait for confirmation
    const receipt = await provider.waitForTransaction(hash);
    console.log('✅ Confirmed in block:', receipt.blockNumber);
    
    // Check shares
    console.log('\nChecking shares...');
    const shares = await sdk.vault.getUserShares({
      userAddress: EOA,
      vaultAddress: VAULT,
    });
    
    console.log('Shares:', shares.toString());
    
    console.log('\n🎉 Successfully staked 0.01 ETH!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.data) console.error('Data:', err.data);
  }
}

stakeWithSDK().catch(console.error);
