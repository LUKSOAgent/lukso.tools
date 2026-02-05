const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

// EIP-1167 minimal proxy storage slot
const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

async function checkImplementation() {
  console.log('=== Checking KeyManager Implementation ===\n');
  
  // Get the bytecode
  const code = await provider.getCode(KEY_MANAGER);
  console.log('KeyManager code:', code);
  console.log('Code length:', code.length);
  console.log('');
  
  // EIP-1167 minimal proxy pattern
  // The implementation address is stored at a specific slot
  // For EIP-1167, we can extract it from the bytecode directly
  
  // The standard EIP-1167 bytecode structure:
  // 0x363d3d373d3d3d363d73<implementation_addr>5af43d82803e903d91602b57fd5bf3
  
  if (code.length >= 92) {
    // Extract implementation address from the bytecode
    // Format: 0x363d3d373d3d3d363d73<20_bytes_addr>5af43d82803e903d91602b57fd5bf3
    const implAddr = '0x' + code.slice(22, 62); // Extract 20 bytes after 0x363d3d373d3d3d363d73
    console.log('Extracted implementation address:', implAddr);
    
    const implCode = await provider.getCode(implAddr);
    console.log('Implementation has code:', implCode.length > 2 ? `✅ YES (${implCode.length} bytes)` : '❌ NO');
    console.log('');
    
    // Now try to call getPermissions on the implementation
    const LSP6_ABI = [
      {
        "inputs": [{ "internalType": "address", "name": "addressToCheck", "type": "address" }],
        "name": "getPermissions",
        "outputs": [{ "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }],
        "stateMutability": "view",
        "type": "function"
      }
    ];
    
    const impl = new ethers.Contract(implAddr, LSP6_ABI, provider);
    
    const OLD_CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
    const NEW_CONTROLLER = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';
    
    console.log('Checking permissions on implementation:');
    
    for (const addr of [OLD_CONTROLLER, NEW_CONTROLLER]) {
      try {
        const perms = await impl.getPermissions(addr);
        console.log(`  ${addr}: ${perms}`);
      } catch (e) {
        console.log(`  ${addr}: Error - ${e.message.slice(0, 50)}`);
      }
    }
  }
}

checkImplementation().catch(console.error);
