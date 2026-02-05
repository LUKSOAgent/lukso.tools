const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const TX_HASHES = [
  '0x5e761141fdf195cebaa2edef01e20ab363fbfbdaba10a28ab3724b7a78bd64d0',
  '0x5c0aaed7a43eef3f23e5d2c767eea56b0dd2a2cf11f3709029933e00f983defd'
];

async function analyzeFailures() {
  console.log('🔍 Analyzing Transaction Failures\n');
  
  for (let i = 0; i < TX_HASHES.length; i++) {
    const txHash = TX_HASHES[i];
    console.log(`Transaction ${i + 1}:`, txHash);
    
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      
      console.log('  Status:', receipt.status === 1 ? '✅ Success' : '❌ Failed');
      console.log('  Block:', receipt.blockNumber);
      console.log('  Gas Used:', receipt.gasUsed.toString());
      
      if (receipt.status === 0) {
        console.log('  ❌ Transaction reverted');
        
        // Try to get revert reason
        const tx = await provider.getTransaction(txHash);
        
        try {
          // Simulate the transaction to get revert reason
          const result = await provider.call({
            to: tx.to,
            from: tx.from,
            data: tx.data,
            gasLimit: tx.gasLimit,
            value: tx.value
          }, receipt.blockNumber - 1);
          
          console.log('  Call result:', result);
        } catch (callError) {
          console.log('  Revert reason:', callError.message.slice(0, 200));
          
          // Common revert reasons for Forever Moments
          if (callError.message.includes('Not controller') || callError.message.includes('controller')) {
            console.log('  💡 Issue: Controller/Permission problem');
          } else if (callError.message.includes('Not authorized') || callError.message.includes('authorized')) {
            console.log('  💡 Issue: Authorization required from factory owner');
          } else if (callError.message.includes('Collection not registered')) {
            console.log('  💡 Issue: Collection must be registered first');
          } else if (callError.message.includes('Invalid metadata')) {
            console.log('  💡 Issue: Metadata format problem');
          }
        }
      }
      
      console.log('');
    } catch (e) {
      console.log('  Error getting receipt:', e.message);
      console.log('');
    }
  }
  
  console.log('═══════════════════════════════════════════════════');
  console.log('Summary:');
  console.log('═══════════════════════════════════════════════════');
  console.log('Both transactions reverted, likely due to:');
  console.log('');
  console.log('1. Forever Moments Factory Authorization:');
  console.log('   - Only factory owner or authorized minters can mint');
  console.log('   - Factory owner: 0x7dE347bE3EbAED43065182FcABA462796d6f2a83');
  console.log('   - Our UP is not authorized');
  console.log('');
  console.log('2. Collection Registration:');
  console.log('   - Collection must be registered with Forever Moments');
  console.log('   - Our collection may not be properly registered');
  console.log('');
  console.log('3. Recommendations:');
  console.log('   - Use Forever Moments UI: https://forever-moments.io');
  console.log('   - Contact factory owner for authorization');
  console.log('   - Complete proper collection registration flow');
}

analyzeFailures().catch(console.error);