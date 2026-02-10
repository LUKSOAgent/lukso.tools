const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_2';
const RECIPIENT = '0x93281072aA2725194e571E7FC924541BcCD38819';
const AMOUNT_ETH = '0.000033'; // ~$0.10 at $3000/ETH

const BASE_RPC = 'https://mainnet.base.org';

async function sendBaseETH() {
  console.log('💸 SENDING BASE ETH');
  console.log('===================\n');
  
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('From:', wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH');
  console.log('To:', RECIPIENT);
  console.log('Amount:', AMOUNT_ETH, 'ETH (~$0.10)');
  
  // Send
  console.log('\nSending transaction...');
  const tx = await wallet.sendTransaction({
    to: RECIPIENT,
    value: ethers.parseEther(AMOUNT_ETH)
  });
  
  console.log('Transaction sent:', tx.hash);
  const receipt = await tx.wait();
  
  console.log('\n✅ Transaction confirmed!');
  console.log('Block:', receipt.blockNumber);
  console.log('Gas used:', receipt.gasUsed.toString());
  console.log('Explorer: https://basescan.org/tx/' + receipt.hash);
}

sendBaseETH().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
