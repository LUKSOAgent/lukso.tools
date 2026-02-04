const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const POOL = '0x05ce285A8ac77710AAfDcbD1B26Cf6af3bD1afAb';
const DEPLOYER = '0x7e093ba1474b79481f9b87d66c99a819f25e82e2';

async function analyzeTransactions() {
  console.log('🔍 Analyzing Recent Transactions\n');
  
  // Get the most recent transaction
  const https = require('https');
  const url = `https://explorer.execution.mainnet.lukso.network/api?module=account&action=txlist&address=${POOL}&page=1&offset=5`;
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.status === '1' && result.result.length > 0) {
          const tx = result.result[0];
          
          console.log('Most Recent Transaction:');
          console.log('  Hash:', tx.hash);
          console.log('  From:', tx.from);
          console.log('  To:', tx.to);
          console.log('  Block:', tx.blockNumber);
          console.log('  Gas Used:', tx.gasUsed);
          console.log('  Input length:', tx.input.length);
          console.log('  Input start:', tx.input.substring(0, 20) + '...');
          console.log('');
          
          // Parse the input data
          // It starts with 0x000001e4 which might be a function selector or version
          const input = tx.input;
          console.log('Parsing input data...');
          console.log('  First 4 bytes (after 0x):', input.substring(2, 10));
          console.log('  Pattern:', input.substring(0, 20));
          
          // Look for addresses in the input
          const addressPattern = /(91f6c42c6576d54ee7c82904660eb24973dbe76a|80d898c5a3a0b118a0c8c8adcdbb260fc687f1ce|650e14f636295af421d9bb788636356aa7f5924c|2db41674f2b882889e5e1bd09a3f3613952bc472)/gi;
          const addresses = input.match(addressPattern);
          
          if (addresses) {
            console.log('');
            console.log('Found addresses in input:');
            const uniqueAddresses = [...new Set(addresses)];
            uniqueAddresses.forEach((addr, i) => {
              console.log(`  ${i + 1}. 0x${addr}`);
            });
          }
          
          // Check the deployer
          console.log('');
          console.log('Deployer/Caller:', DEPLOYER);
          checkDeployer();
        }
      } catch (e) {
        console.log('Error:', e.message);
      }
    });
  }).on('error', (e) => {
    console.log('HTTP Error:', e.message);
  });
}

async function checkDeployer() {
  const code = await provider.getCode(DEPLOYER);
  console.log('Deployer has code:', code.length > 2 ? `✅ Yes (${code.length} bytes)` : '❌ No (EOA)');
  
  if (code.length <= 2) {
    console.log('The deployer is an EOA (Externally Owned Account)');
    console.log('This means a person directly interacts with the pool');
  }
}

analyzeTransactions();