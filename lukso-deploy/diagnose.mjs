import { 
  createPublicClient, 
  http, 
  defineChain,
  encodeFunctionData,
  decodeErrorResult,
  toBytes,
  keccak256,
  slice,
  hexToBytes
} from 'viem';

// LUKSO Mainnet configuration
const luksoMainnet = defineChain({
  id: 42,
  name: 'LUKSO Mainnet',
  network: 'lukso-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'LYX',
    symbol: 'LYX',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.mainnet.lukso.network'],
    },
    public: {
      http: ['https://rpc.mainnet.lukso.network'],
    },
  },
});

// Create public client
const publicClient = createPublicClient({
  chain: luksoMainnet,
  transport: http(),
});

// Test the compute function to understand what's happening
async function diagnose() {
  console.log('🔍 LSP23 Deployment Diagnostics');
  console.log('================================');
  console.log('');

  // Error signature we're investigating
  const errorSignature = '0x9654a854';
  console.log(`Error signature: ${errorSignature}`);
  console.log('');

  // Try to decode the error
  console.log('Attempting to decode error signature...');
  console.log('');

  // Test if this matches any known error patterns
  const LSP23_ABI = [
    {
      name: 'deployERC1167Proxies',
      type: 'function',
      inputs: [
        {
          components: [
            { name: 'salt', type: 'bytes32' },
            { name: 'fundingAmount', type: 'uint256' },
            { name: 'implementationContract', type: 'address' },
            { name: 'initializationCalldata', type: 'bytes' },
          ],
          name: 'primaryContractDeploymentInit',
          type: 'tuple',
        },
        {
          components: [
            { name: 'fundingAmount', type: 'uint256' },
            { name: 'implementationContract', type: 'address' },
            { name: 'initializationCalldata', type: 'bytes' },
            { name: 'addPrimaryContractAddress', type: 'bool' },
            { name: 'extraInitializationParams', type: 'bytes' },
          ],
          name: 'secondaryContractDeploymentInit',
          type: 'tuple',
        },
        { name: 'postDeploymentModule', type: 'address' },
        { name: 'postDeploymentModuleCalldata', type: 'bytes' },
      ],
      outputs: [
        { name: 'primaryContractAddress', type: 'address' },
        { name: 'secondaryContractAddress', type: 'address' },
      ],
      stateMutability: 'payable',
    },
  ];

  // Check if contracts are deployed
  const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
  const UP_IMPLEMENTATION = '0x52c90985AF970D4E0DC26Cb5D052505278aF32A9';
  const KM_IMPLEMENTATION = '0xa75684d7D048704a2DB851D05Ba0c3cbe226264C';

  console.log('Checking contract deployments...');
  console.log('');

  const factoryCode = await publicClient.getBytecode({ address: LSP23_FACTORY });
  console.log(`LSP23 Factory (${LSP23_FACTORY}):`);
  console.log(`  Code: ${factoryCode ? '✅ Deployed (' + factoryCode.length + ' bytes)' : '❌ Not deployed'}`);
  console.log('');

  const upCode = await publicClient.getBytecode({ address: UP_IMPLEMENTATION });
  console.log(`UP Implementation (${UP_IMPLEMENTATION}):`);
  console.log(`  Code: ${upCode ? '✅ Deployed (' + upCode.length + ' bytes)' : '❌ Not deployed'}`);
  console.log('');

  const kmCode = await publicClient.getBytecode({ address: KM_IMPLEMENTATION });
  console.log(`KM Implementation (${KM_IMPLEMENTATION}):`);
  console.log(`  Code: ${kmCode ? '✅ Deployed (' + kmCode.length + ' bytes)' : '❌ Not deployed'}`);
  console.log('');

  // Check if the error signature appears in the factory bytecode
  if (factoryCode) {
    if (factoryCode.toLowerCase().includes(errorSignature.slice(2).toLowerCase())) {
      console.log(`✅ Error signature ${errorSignature} FOUND in factory bytecode!`);
      
      // Find the context around the error
      const index = factoryCode.toLowerCase().indexOf(errorSignature.slice(2).toLowerCase());
      const context = factoryCode.slice(Math.max(0, index - 100), index + 100);
      console.log(`  Context around error: ...${context}...`);
    } else {
      console.log(`❌ Error signature ${errorSignature} NOT found in factory bytecode`);
    }
  }
  console.log('');

  // Check what function calls could lead to this error
  console.log('Analysis:');
  console.log('---------');
  console.log('The error 0x9654a854 occurs during the deployment process.');
  console.log('');
  console.log('Possible causes:');
  console.log('1. Salt collision - the computed address already has code');
  console.log('2. Implementation contract not properly deployed');
  console.log('3. Invalid initialization calldata');
  console.log('4. Factory contract bug or incompatibility');
  console.log('');

  // Check if the factory bytecode contains this error in specific contexts
  if (factoryCode) {
    console.log('Factory bytecode analysis:');
    console.log(`  Length: ${factoryCode.length} bytes`);
    console.log(`  First 100 bytes: ${factoryCode.slice(0, 200)}`);
    console.log('');
    
    // Look for revert patterns
    const revertPattern = '4e487b71'; // keccak256("Panic(uint256)")[:4]
    if (factoryCode.toLowerCase().includes(revertPattern)) {
      console.log('  ✅ Factory contains Panic(uint256) error handling');
    }
  }

  console.log('');
  console.log('================================');
}

diagnose().catch(console.error);
