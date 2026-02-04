const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const POOL = '0x05ce285A8ac77710AAfDcbD1B26Cf6af3bD1afAb';

async function findDeployment() {
  console.log('🔍 Finding Contract Deployment\n');
  
  // Binary search to find when the contract was deployed
  let low = 0;
  let high = await provider.getBlockNumber();
  
  console.log('Searching for deployment block...');
  console.log('Current block:', high);
  
  // Quick check - see if contract exists at recent blocks
  const recentCode = await provider.getCode(POOL);
  if (recentCode.length <= 2) {
    console.log('Contract does not exist at current block');
    return;
  }
  
  // Find deployment block using binary search
  let deploymentBlock = high;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const code = await provider.getCode(POOL, mid);
    
    if (code.length > 2) {
      deploymentBlock = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  
  console.log('\n✅ Contract deployed at block:', deploymentBlock);
  
  // Get the block
  const block = await provider.getBlock(deploymentBlock);
  console.log('Timestamp:', new Date(block.timestamp * 1000).toISOString());
  console.log('Transactions in block:', block.transactions.length);
  
  // Look for the creation transaction
  console.log('\nSearching for creation transaction...');
  
  for (const txHash of block.transactions) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt && receipt.contractAddress && receipt.contractAddress.toLowerCase() === POOL.toLowerCase()) {
      console.log('');
      console.log('🎉 Found creation transaction!');
      console.log('  Tx Hash:', txHash);
      console.log('  From:', receipt.from);
      console.log('  Gas Used:', receipt.gasUsed.toString());
      console.log('  Deployer:', receipt.from);
      
      // Get the transaction
      const tx = await provider.getTransaction(txHash);
      console.log('  Data length:', tx.data.length);
      
      return {
        block: deploymentBlock,
        txHash: txHash,
        deployer: receipt.from
      };
    }
  }
  
  console.log('Creation transaction not found in this block');
  console.log('Contract might have been created via CREATE2');
}

findDeployment().catch(console.error);