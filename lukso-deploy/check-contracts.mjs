import { createPublicClient, http, defineChain, getContract } from 'viem';
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

// Minimal ERC165 ABI for supportsInterface
const ERC165_ABI = [
  {
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Minimal implementation ABI
const IMPLEMENTATION_ABI = [
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getData',
    outputs: [{ name: '', type: 'bytes' }],
    stateMutability: 'view',
    type: 'function',
  },
];

async function checkContracts() {
  console.log('🔍 Checking LUKSO Mainnet Contract Deployments');
  console.log('==============================================');
  console.log('');

  const publicClient = createPublicClient({
    chain: luksoMainnet,
    transport: http(),
  });

  // Contract addresses from versions.json
  const LSP23_FACTORY = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';
  const UP_IMPLEMENTATION = '0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F'; // v0.14.0
  const KM_IMPLEMENTATION = '0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4'; // v0.14.0
  const URD = '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D'; // v0.14.0

  const contracts = [
    { name: 'LSP23 Factory', address: LSP23_FACTORY },
    { name: 'UP Implementation v0.14.0', address: UP_IMPLEMENTATION },
    { name: 'KeyManager Implementation v0.14.0', address: KM_IMPLEMENTATION },
    { name: 'URD v0.14.0', address: URD },
  ];

  for (const contract of contracts) {
    console.log(`Checking ${contract.name}...`);
    console.log(`  Address: ${contract.address}`);
    
    try {
      const code = await publicClient.getBytecode({ address: contract.address });
      if (code && code.length > 2) {
        console.log(`  ✅ Contract deployed (${code.length} bytes)`);
        
        // Try to check if it's a valid implementation
        try {
          const implContract = getContract({
            address: contract.address,
            abi: IMPLEMENTATION_ABI,
            client: publicClient,
          });
          
          // Try to get owner (will fail if not initialized)
          const owner = await implContract.read.owner().catch(() => null);
          if (owner) {
            console.log(`  Owner: ${owner}`);
          }
        } catch (e) {
          // Expected for implementations
        }
      } else {
        console.log(`  ❌ Contract NOT deployed!`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  // Check wallet balance
  console.log('Checking Wallet...');
  console.log('');
  
  if (existsSync('up-deployment-credentials.json')) {
    const credentials = JSON.parse(readFileSync('up-deployment-credentials.json', 'utf8'));
    const walletAddress = credentials.walletAddress;
    
    try {
      const balance = await publicClient.getBalance({ address: walletAddress });
      console.log(`  Address: ${walletAddress}`);
      console.log(`  Balance: ${Number(balance) / 1e18} LYX`);
      console.log(`  Code: ${await publicClient.getBytecode({ address: walletAddress })}`);
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }

  console.log('');
  console.log('==============================================');
  console.log('Analysis complete.');
}

checkContracts().catch(console.error);
