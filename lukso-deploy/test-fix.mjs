import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  defineChain,
  encodeFunctionData,
  slice,
  keccak256,
  toBytes,
  concat
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync, existsSync } from 'fs';

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

async function testFix() {
  console.log('🔧 Testing LSP23 Deployment Fix');
  console.log('================================');
  console.log('');

  // Load credentials
  if (!existsSync('up-deployment-credentials.json')) {
    console.error('❌ No credentials file found!');
    process.exit(1);
  }
  
  const credentials = JSON.parse(readFileSync('up-deployment-credentials.json', 'utf8'));
  const walletAddress = credentials.walletAddress;
  const privateKey = credentials.privateKey;

  const account = privateKeyToAccount(privateKey);

  const publicClient = createPublicClient({
    chain: luksoMainnet,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: luksoMainnet,
    transport: http(),
  });

  // Check balance
  const balance = await publicClient.getBalance({ address: walletAddress });
  console.log(`Wallet: ${walletAddress}`);
  console.log(`Balance: ${Number(balance) / 1e18} LYX`);
  console.log('');

  const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
  const UP_IMPLEMENTATION = '0x52c90985AF970D4E0DC26Cb5D052505278aF32A9';
  const KM_IMPLEMENTATION = '0xa75684d7D048704a2DB851D05Ba0c3cbe226264C';

  // Generate a new random salt
  const salt = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  // ABIs
  const UP_INIT_ABI = [
    {
      inputs: [{ name: 'initialOwner', type: 'address' }],
      name: 'initialize',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
  ];

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
      name: 'deployERC1167Proxies',
      outputs: [
        { name: 'primaryContractAddress', type: 'address' },
        { name: 'secondaryContractAddress', type: 'address' },
      ],
      stateMutability: 'payable',
      type: 'function',
    },
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

  // THE FIX: When addPrimaryContractAddress=true, don't encode a full function call
  // Just use the function selector, the factory will append the actual UP address
  const upInitCalldata = encodeFunctionData({
    abi: UP_INIT_ABI,
    functionName: 'initialize',
    args: [walletAddress],
  });

  // FIX: Use just the function selector for KM init when addPrimaryContractAddress=true
  // The selector for initialize(address) is 0xc4d66de8
  const kmInitCalldataFix = '0xc4d66de8'; // Just the selector, no parameters
  // Or alternatively: const kmInitCalldataFix = '0x'; // Empty bytes

  console.log('Testing with FIXED initialization calldata:');
  console.log(`  UP Init: ${upInitCalldata}`);
  console.log(`  KM Init (FIXED): ${kmInitCalldataFix} (just selector, no params)`);
  console.log(`  addPrimaryContractAddress: true`);
  console.log('');
  console.log('Expected behavior:');
  console.log('  Factory will append abi.encode(UP_ADDRESS) to kmInitCalldata');
  console.log('  Result: initialize(actual_UP_address) ✓');
  console.log('');

  // Compute addresses
  console.log('Computing expected addresses...');
  const [expectedUP, expectedKM] = await publicClient.readContract({
    address: LSP23_FACTORY,
    abi: LSP23_ABI,
    functionName: 'computeERC1167Addresses',
    args: [
      {
        salt,
        fundingAmount: 0n,
        implementationContract: UP_IMPLEMENTATION,
        initializationCalldata: upInitCalldata,
      },
      {
        fundingAmount: 0n,
        implementationContract: KM_IMPLEMENTATION,
        initializationCalldata: kmInitCalldataFix,
        addPrimaryContractAddress: true,
        extraInitializationParams: '0x',
      },
      '0x0000000000000000000000000000000000000000',
      '0x',
    ],
  });

  console.log(`  Expected UP: ${expectedUP}`);
  console.log(`  Expected KM: ${expectedKM}`);
  console.log('');

  // Check if already deployed
  const upCode = await publicClient.getBytecode({ address: expectedUP });
  if (upCode && upCode.length > 2) {
    console.log('  ⚠️  Contracts already deployed at these addresses');
    console.log('  Use a different salt to test deployment');
    return;
  }

  // Try deployment with the fix
  console.log('⏳ Attempting deployment with FIX...');
  console.log('');

  try {
    const { request } = await publicClient.simulateContract({
      address: LSP23_FACTORY,
      abi: LSP23_ABI,
      functionName: 'deployERC1167Proxies',
      args: [
        {
          salt,
          fundingAmount: 0n,
          implementationContract: UP_IMPLEMENTATION,
          initializationCalldata: upInitCalldata,
        },
        {
          fundingAmount: 0n,
          implementationContract: KM_IMPLEMENTATION,
          initializationCalldata: kmInitCalldataFix,
          addPrimaryContractAddress: true,
          extraInitializationParams: '0x',
        },
        '0x0000000000000000000000000000000000000000',
        '0x',
      ],
      account,
    });

    console.log('✅ Simulation SUCCESSFUL!');
    console.log('  The fix works - deployment should succeed');
    console.log('');
    console.log('Transaction would be:');
    console.log(`  To: ${request.address}`);
    console.log(`  Data: ${request.data.slice(0, 100)}...`);
    console.log('');

    // Actually execute the deployment
    console.log('Executing transaction...');
    const txHash = await walletClient.writeContract(request);
    console.log(`  Transaction: ${txHash}`);
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`  ✅ Confirmed in block ${receipt.blockNumber}`);
    console.log(`  Gas used: ${receipt.gasUsed}`);
    console.log('');

    console.log('🎉 DEPLOYMENT SUCCESSFUL WITH FIX!');
    console.log('================================');
    console.log(`Universal Profile: ${expectedUP}`);
    console.log(`Key Manager: ${expectedKM}`);
    console.log('');
    console.log('The root cause was confirmed and the fix works!');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('');
    console.log('Error indicates the fix may need adjustment.');
    console.log('Trying alternative fix (empty bytes)...');
    console.log('');

    // Try with empty bytes
    try {
      const { request } = await publicClient.simulateContract({
        address: LSP23_FACTORY,
        abi: LSP23_ABI,
        functionName: 'deployERC1167Proxies',
        args: [
          {
            salt,
            fundingAmount: 0n,
            implementationContract: UP_IMPLEMENTATION,
            initializationCalldata: upInitCalldata,
          },
          {
            fundingAmount: 0n,
            implementationContract: KM_IMPLEMENTATION,
            initializationCalldata: '0x', // Empty bytes
            addPrimaryContractAddress: true,
            extraInitializationParams: '0x',
          },
          '0x0000000000000000000000000000000000000000',
          '0x',
        ],
        account,
      });

      console.log('✅ Alternative fix (empty bytes) SUCCESSFUL!');
      console.log('  The issue is confirmed - initializationCalldata should be empty or just selector');
      
    } catch (error2) {
      console.error('❌ Alternative also failed:', error2.message);
      console.log('');
      console.log('There may be other issues at play.');
    }
  }
}

testFix().catch(console.error);
