const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const ADDRESSES = [
  '0x41b4c4667b99aa73dc6321d8c883f139e7ed6f1f',  // Claimed as KM in UP data
  '0x3B0492fF46B7A4Dc48Aeb2Eb0595a11FD530d125',  // Claimed as KM in deployment
  '0x959cd83F6144Eaf80bFBAf5bA5fc2f416beA38E4'   // Collection UP
];

async function checkAddresses() {
  console.log('🔍 Checking Contract Types\n');
  
  for (const addr of ADDRESSES) {
    console.log('Address:', addr);
    
    const code = await provider.getCode(addr);
    console.log('  Code size:', code.length / 2 - 1, 'bytes');
    console.log('  Is contract:', code.length > 2);
    
    if (code.length > 2) {
      // Check for proxy pattern
      const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
      const impl = await provider.getStorage(addr, IMPLEMENTATION_SLOT);
      
      if (impl !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('  Is ERC1967 proxy: YES');
        console.log('  Implementation:', '0x' + impl.slice(-40));
      } else {
        console.log('  Is ERC1967 proxy: NO');
      }
      
      // Try to detect if it's a KeyManager by looking at the bytecode
      // KeyManager typically has specific function signatures
      const isKeyManager = code.includes('8da5cb5b') || // owner()
                           code.includes('d01d6e94') || // target()
                           code.includes('09a966cb');   // execute(bytes)
      console.log('  Likely KeyManager:', isKeyManager);
      
      // Try to detect if it's a UP
      const isUP = code.includes('24871b3a') || // LSP0 interface
                   code.includes('54f6127f');   // getData(bytes32)
      console.log('  Likely UP:', isUP);
      
      // Check LSP20 calling mechanism
      const hasLSP20 = code.includes('1e9c87a3') || // lsp20VerifyCall
                       code.includes('98403f0e');   // lsp20VerifyCallResult
      console.log('  Has LSP20:', hasLSP20);
    }
    
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════');
  console.log('Analysis:');
  console.log('═══════════════════════════════════════════════════');
  console.log('The address stored in the Collection UP as "KeyManager"');
  console.log('(0x41b4c4667b99aa73dc6321d8c883f139e7ed6f1f)');
  console.log('does not behave like a standard LSP6 KeyManager.');
  console.log('');
  console.log('This might be:');
  console.log('  1. An LSP20 contract that handles authorization differently');
  console.log('  2. A custom implementation');
  console.log('  3. The wrong data key being read');
  console.log('');
  console.log('The Collection UP itself might use LSP20 for authorization');
  console.log('instead of LSP6 KeyManager.');
}

checkAddresses().catch(console.error);