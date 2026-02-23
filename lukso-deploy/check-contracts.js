import { createPublicClient, http } from 'viem';
import { luksoTestnet } from 'viem/chains';

const publicClient = createPublicClient({
  chain: luksoTestnet,
  transport: http(),
});

// Contract addresses from versions.json
const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
const UP_IMPLEMENTATION = '0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F'; // v0.14.0
const KM_IMPLEMENTATION = '0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4'; // v0.14.0
const URD = '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D'; // v0.14.0

async function checkContract(address, name) {
  try {
    const code = await publicClient.getBytecode({ address });
    if (code && code.length > 2) {
      console.log(`✅ ${name}: ${address} - DEPLOYED`);
      return true;
    } else {
      console.log(`❌ ${name}: ${address} - NOT DEPLOYED`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${address} - ERROR: ${error.message}`);
    return false;
  }
}

console.log('🔍 Checking contract deployments on LUKSO Testnet...\n');

await checkContract(LSP23_FACTORY, 'LSP23 Factory');
await checkContract(UP_IMPLEMENTATION, 'UP Implementation (v0.14.0)');
await checkContract(KM_IMPLEMENTATION, 'KeyManager Implementation (v0.14.0)');
await checkContract(URD, 'UniversalReceiverDelegate (v0.14.0)');

console.log('\n🧪 Attempting to call computeERC1167Addresses...');

// Try calling the compute function directly to see if the factory works
const LSP23_ABI = [
  {
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
    name: 'computeERC1167Addresses',
    outputs: [
      { name: 'primaryContractAddress', type: 'address' },
      { name: 'secondaryContractAddress', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

try {
  const salt = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  
  // Simple initialization calldata for UP (initialize(address))
  const upInitCalldata = '0xc4d66de8000000000000000000000000e093a714960da1bf297522617bfc08132b62b86a';
  
  // KM init calldata (initialize(address)) - with placeholder
  const kmInitCalldata = '0xc4d66de80000000000000000000000000000000000000000000000000000000000000000';
  
  const primaryContractDeploymentInit = {
    salt: salt,
    fundingAmount: 0n,
    implementationContract: UP_IMPLEMENTATION,
    initializationCalldata: upInitCalldata,
  };

  const secondaryContractDeploymentInit = {
    fundingAmount: 0n,
    implementationContract: KM_IMPLEMENTATION,
    initializationCalldata: kmInitCalldata,
    addPrimaryContractAddress: true,
    extraInitializationParams: '0x',
  };

  const result = await publicClient.readContract({
    address: LSP23_FACTORY,
    abi: LSP23_ABI,
    functionName: 'computeERC1167Addresses',
    args: [
      primaryContractDeploymentInit,
      secondaryContractDeploymentInit,
      '0x0000000000000000000000000000000000000000',
      '0x',
    ],
  });
  
  console.log('✅ computeERC1167Addresses succeeded!');
  console.log('   UP Address:', result[0]);
  console.log('   KM Address:', result[1]);
} catch (error) {
  console.log('❌ computeERC1167Addresses failed:', error.message);
  if (error.cause) {
    console.log('   Cause:', error.cause.message || error.cause);
  }
}
