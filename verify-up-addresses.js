const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const addressesToCheck = [
  '0x514400F1B19312e7700064C919bCa0E0269B8aE5', // theCryptoson
  '0xBbD47382a102E6f966a3339d0647242064aaA747', // Krexxxen  
  '0xAd39ffbD42AB449ADCEEDB83e4Dfb4c238d5eaBD', // criegle
  '0x9797953494aD45Dd40195C6416b289787DB9ABE6'  // 0xantonioeth
];

async function verifyAddresses() {
  console.log('Verifying UP addresses...\n');
  
  for (const address of addressesToCheck) {
    try {
      // Check if address has code (is a contract)
      const code = await provider.getCode(address);
      const hasCode = code !== '0x';
      
      // Check if it supports LSP0 (ERC725Account)
      let isUP = false;
      if (hasCode) {
        try {
          const contract = new ethers.Contract(address, [
            'function supportsInterface(bytes4 interfaceId) external view returns (bool)'
          ], provider);
          
          // LSP0 interface ID: 0x63cb749b
          isUP = await contract.supportsInterface('0x63cb749b');
        } catch (e) {
          // Might not have supportsInterface
        }
      }
      
      console.log(`${address}:`);
      console.log(`  Has code: ${hasCode ? '✅' : '❌'}`);
      console.log(`  Is UP (LSP0): ${isUP ? '✅' : '❓'}`);
      console.log('');
      
    } catch (error) {
      console.log(`${address}: ❌ Error - ${error.message}`);
    }
  }
}

verifyAddresses();