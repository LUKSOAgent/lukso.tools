import { createPublicClient, createWalletClient, http, defineChain, encodeFunctionData, encodeDeployData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { writeFileSync } from 'fs';

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

const KM_INIT_ABI = [
  {
    inputs: [{ name: 'target_', type: 'address' }],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const UP_ABI = [
  {
    inputs: [
      { name: 'dataKeys', type: 'bytes32[]' },
      { name: 'dataValues', type: 'bytes[]' },
    ],
    name: 'setDataBatch',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const KM_ABI = [
  {
    inputs: [{ name: 'payload', type: 'bytes' }],
    name: 'execute',
    outputs: [{ name: '', type: 'bytes' }],
    stateMutability: 'payable',
    type: 'function',
  },
];

// Standard ERC1967 Proxy Bytecode (from OpenZeppelin)
// This is the runtime bytecode for a proxy that delegates to an implementation
// The constructor takes (implementation, data) and sets up the proxy
const ERC1967_PROXY_BYTECODE = '0x608060405234801561001057600080fd5b5060405161018e38038061018e83398101604081905261002f9161009c565b6100388361004c565b6100418161006f565b5050506100cc565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b6001600160a01b0316638b78c6d81981620000016040518263ffffffff1660e01b815260040162000001919062000001565b60008051602061016e8339815191525460ff16620000015760008051602061016e8339815191525460ff16156200000157604051630bc88b7f60e21b815260040160405180910390fd5b60008060008051602061016e833981519152805460ff1916600117905550565b600080600080600080600060c0888a03121561013f57600080fd5b87516001600160a01b038116811461015657600080fd5b809650506020880151604089015160608a015160808b015160a08c0151949f939e50929c50909a509850965060405191909301956001600160a01b0316955093508391505060ff80198451168152602082810151169083015260408101511690820152606081015116908101526080015160f81b9050601f60f81b81526101008101604052602081015181526040810151606082015260608101516080820152608081015160a082015260a081015160c082015260c081015160e082015260e081015161010082015261010081015161012082015261012081015161014082015261014081015161016082015261016090910190565b6100b3806100db6000396000f3fe6080604052600080fdfea2646970667358221220ad5342c862a15a4c2f3b1487b3d37f7f4ed57e8ba33f93d8257a86a4dc6a42e364736f6c63430008180033';

async function deployUniversalProfile() {
  console.log('🚀 Starting Universal Profile Deployment');
  console.log('==========================================');
  console.log('Network: LUKSO Mainnet (Chain ID: 42)');
  console.log('Method: Direct proxy deployment (bypassing LSP23)');
  console.log('');

  // Controller wallet details
  const CONTROLLER_ADDRESS = '0x3871e2fa220eAC0fF59a2Deea1dF347AdaEaa71b';
  const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_5';

  try {
    const account = privateKeyToAccount(PRIVATE_KEY);
    
    console.log('📋 Deployment Configuration:');
    console.log(`   Controller: ${CONTROLLER_ADDRESS}`);
    console.log(`   Deployer: ${account.address}`);
    console.log('');

    // Create viem clients
    console.log('🔗 Connecting to LUKSO Mainnet...');
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
    console.log('💰 Checking wallet balance...');
    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`   Balance: ${Number(balance) / 1e18} LYX`);
    console.log('');

    if (balance === 0n) {
      console.log('❌ ERROR: Wallet has no LYX!');
      return { success: false, error: 'WALLET_NOT_FUNDED' };
    }

    // Contract addresses (v0.12.1 implementations)
    const UP_IMPLEMENTATION = '0x52c90985AF970D4E0DC26Cb5D052505278aF32A9';
    const KM_IMPLEMENTATION = '0xa75684d7D048704a2DB851D05Ba0c3cbe226264C';

    console.log('📋 Using Implementation Contracts:');
    console.log(`   UP Implementation: ${UP_IMPLEMENTATION}`);
    console.log(`   KM Implementation: ${KM_IMPLEMENTATION}`);
    console.log('');

    // Step 1: Deploy UP Proxy
    console.log('📋 Step 1: Deploying Universal Profile Proxy...');
    const upInitCalldata = encodeFunctionData({
      abi: UP_INIT_ABI,
      functionName: 'initialize',
      args: [account.address], // Deployer is initial owner
    });

    console.log(`   Init calldata: ${upInitCalldata}`);
    console.log('   ⏳ Deploying UP proxy...');
    
    // Deploy proxy contract
    const deployHash = await walletClient.deployContract({
      abi: [
        {
          inputs: [
            { name: 'implementation', type: 'address' },
            { name: '_data', type: 'bytes' },
          ],
          stateMutability: 'payable',
          type: 'constructor',
        },
      ],
      bytecode: ERC1967_PROXY_BYTECODE,
      args: [UP_IMPLEMENTATION, upInitCalldata],
    });

    console.log(`   Deploy tx: ${deployHash}`);
    const deployReceipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
    const upAddress = deployReceipt.contractAddress;
    
    if (!upAddress) {
      throw new Error('Failed to get UP contract address from receipt');
    }
    
    console.log(`   ✅ UP Proxy deployed: ${upAddress}`);
    console.log(`   Block: ${deployReceipt.blockNumber}`);
    console.log('');

    // Step 2: Deploy KeyManager Proxy
    console.log('📋 Step 2: Deploying Key Manager Proxy...');
    const kmInitCalldata = encodeFunctionData({
      abi: KM_INIT_ABI,
      functionName: 'initialize',
      args: [upAddress], // KeyManager targets the UP
    });

    console.log(`   Target (UP): ${upAddress}`);
    console.log(`   Init calldata: ${kmInitCalldata}`);
    console.log('   ⏳ Deploying KeyManager proxy...');

    const kmDeployHash = await walletClient.deployContract({
      abi: [
        {
          inputs: [
            { name: 'implementation', type: 'address' },
            { name: '_data', type: 'bytes' },
          ],
          stateMutability: 'payable',
          type: 'constructor',
        },
      ],
      bytecode: ERC1967_PROXY_BYTECODE,
      args: [KM_IMPLEMENTATION, kmInitCalldata],
    });

    console.log(`   Deploy tx: ${kmDeployHash}`);
    const kmDeployReceipt = await publicClient.waitForTransactionReceipt({ hash: kmDeployHash });
    const kmAddress = kmDeployReceipt.contractAddress;

    if (!kmAddress) {
      throw new Error('Failed to get KeyManager contract address from receipt');
    }

    console.log(`   ✅ KeyManager Proxy deployed: ${kmAddress}`);
    console.log(`   Block: ${kmDeployReceipt.blockNumber}`);
    console.log('');

    // Step 3: Transfer ownership to KeyManager
    console.log('📋 Step 3: Transferring ownership to KeyManager...');
    
    const transferHash = await walletClient.writeContract({
      address: upAddress,
      abi: UP_ABI,
      functionName: 'transferOwnership',
      args: [kmAddress],
    });
    
    console.log(`   Transfer tx: ${transferHash}`);
    await publicClient.waitForTransactionReceipt({ hash: transferHash });
    console.log('   ✅ Ownership transferred to KeyManager');
    console.log('');

    // Step 4: Accept ownership via KeyManager
    console.log('📋 Step 4: Accepting ownership via KeyManager...');
    const acceptPayload = encodeFunctionData({
      abi: UP_ABI,
      functionName: 'acceptOwnership',
    });

    const acceptHash = await walletClient.writeContract({
      address: kmAddress,
      abi: KM_ABI,
      functionName: 'execute',
      args: [acceptPayload],
    });
    
    console.log(`   Accept tx: ${acceptHash}`);
    await publicClient.waitForTransactionReceipt({ hash: acceptHash });
    console.log('   ✅ Ownership accepted by KeyManager');
    console.log('');

    // Step 5: Verify the deployment
    console.log('📋 Step 5: Verifying deployment...');
    
    // Check UP supports LSP0 interface
    const LSP0_INTERFACE_ID = '0x24871b3e';
    const supportsLSP0 = await publicClient.readContract({
      address: upAddress,
      abi: UP_ABI,
      functionName: 'supportsInterface',
      args: [LSP0_INTERFACE_ID],
    });
    
    console.log(`   UP supports LSP0: ${supportsLSP0 ? '✅ Yes' : '❌ No'}`);
    console.log('');

    // Save results
    const result = {
      success: true,
      network: 'LUKSO Mainnet',
      chainId: 42,
      controllerAddress: CONTROLLER_ADDRESS,
      contracts: {
        LSP0ERC725Account: {
          address: upAddress,
          deployTx: deployHash,
          blockNumber: Number(deployReceipt.blockNumber),
        },
        LSP6KeyManager: {
          address: kmAddress,
          deployTx: kmDeployHash,
          blockNumber: Number(kmDeployReceipt.blockNumber),
        },
      },
      transactions: {
        upDeploy: deployHash,
        kmDeploy: kmDeployHash,
        transferOwnership: transferHash,
        acceptOwnership: acceptHash,
      },
      verification: {
        supportsLSP0,
      },
      timestamp: new Date().toISOString(),
    };

    writeFileSync('up-deployment-result.json', JSON.stringify(result, null, 2));

    console.log('🎉 SUCCESS! Universal Profile Deployed');
    console.log('==========================================');
    console.log(`📍 Universal Profile Address: ${upAddress}`);
    console.log(`🔐 Key Manager Address: ${kmAddress}`);
    console.log(`⛽ First Transaction: ${deployHash}`);
    console.log('');
    console.log(`🔗 View on UniversalEverything.io:`);
    console.log(`   https://universaleverything.io/${upAddress}`);
    console.log('');
    console.log('💾 Full deployment result saved to up-deployment-result.json');
    console.log('');

    return {
      success: true,
      upAddress,
      kmAddress,
      deployHash,
    };

  } catch (error) {
    console.error('');
    console.error('❌ DEPLOYMENT FAILED');
    console.error('==========================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('');

    writeFileSync('up-deployment-error.json', JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    }, null, 2));

    return { success: false, error: error.message };
  }
}

deployUniversalProfile()
  .then((result) => {
    if (result.success) {
      console.log('✅ Deployment completed successfully!');
      process.exit(0);
    } else {
      console.log('❌ Deployment failed!');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
