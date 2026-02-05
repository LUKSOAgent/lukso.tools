const { ethers } = require('ethers');
const fs = require('fs');

// Setup provider and wallet
const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

// Addresses
const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER_ADDRESS = '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5';
const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';

// Key Manager - we need to find this or use the UP directly
// LSP0 (UP) has execute function
// LSP6 (KeyManager) controls the UP

const UP_ABI = [
  'function execute(uint256 operation, address to, uint256 value, bytes calldata data) returns (bytes memory)',
  'function owner() view returns (address)',
  'function getData(bytes32 dataKey) view returns (bytes)'
];

const REGISTRY_ABI = [
  'function registerCollection(address collectionUP, bytes memory metadata)'
];

// LSP6 KeyManager ABI
const KEY_MANAGER_ABI = [
  'function execute(bytes calldata payload) returns (bytes memory)',
  'function getNonce(address _address, uint128 _channel) view returns (uint256)',
  'function getData(bytes32 dataKey) view returns (bytes)'
];

// Get collection metadata
function getCollectionMetadata() {
  return {
    LSP4Metadata: {
      name: "LUKSOAgent Journey",
      description: "A collection documenting the journey of Jordy's Assistant - an AI agent exploring the LUKSO ecosystem, capturing moments of creation, learning, and community engagement.",
      links: [
        { title: "Twitter", url: "https://twitter.com/JordysAssistant" },
        { title: "LUKSO", url: "https://lukso.network" }
      ],
      icons: [],
      images: [],
      assets: [],
      attributes: [
        { key: "Creator", value: "Jordy's Assistant", type: "string" },
        { key: "Created", value: new Date().toISOString(), type: "string" },
        { key: "Type", value: "AI Journey", type: "string" }
      ]
    }
  };
}

async function findKeyManager() {
  console.log('🔑 Finding Key Manager\n');
  
  const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
  
  // LSP6 Key Manager address is stored at data key 0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5
  // This is keccak256('LSP6KeyManagerAddress')
  const keyManagerKey = '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5';
  
  try {
    const keyManagerData = await up.getData(keyManagerKey);
    console.log('Key Manager data:', keyManagerData);
    
    if (keyManagerData && keyManagerData.length >= 42) {
      // Extract address from bytes
      const keyManager = '0x' + keyManagerData.slice(-40);
      console.log('Key Manager:', keyManager);
      return keyManager;
    }
  } catch (e) {
    console.log('Error getting Key Manager from data:', e.message);
  }
  
  // Alternative: Check if owner is a contract
  try {
    const owner = await up.owner();
    console.log('UP Owner:', owner);
    
    // Check if owner is a contract (KeyManager)
    const ownerCode = await provider.getCode(owner);
    if (ownerCode !== '0x') {
      console.log('Owner is a contract (likely KeyManager)');
      return owner;
    }
  } catch (e) {
    console.log('Error getting owner:', e.message);
  }
  
  return null;
}

async function registerCollectionViaUP(keyManagerAddress) {
  console.log('📚 Registering Collection via UP\n');
  
  const metadata = getCollectionMetadata();
  const metadataBytes = ethers.toUtf8Bytes(JSON.stringify(metadata));
  
  console.log('Collection UP:', UP_ADDRESS);
  console.log('Collection Name:', metadata.LSP4Metadata.name);
  console.log('Metadata length:', metadataBytes.length, 'bytes');
  console.log('Key Manager:', keyManagerAddress);
  console.log('');
  
  // Encode the registerCollection call
  const registryInterface = new ethers.Interface(REGISTRY_ABI);
  const registerData = registryInterface.encodeFunctionData('registerCollection', [
    UP_ADDRESS,  // The UP address as the collection
    metadataBytes
  ]);
  
  console.log('Registry call data:', registerData.slice(0, 60) + '...');
  
  // Encode the UP execute call
  const upInterface = new ethers.Interface(UP_ABI);
  const upExecuteData = upInterface.encodeFunctionData('execute', [
    0, // OPERATION_CALL
    COLLECTION_REGISTRY,
    0, // No value
    registerData
  ]);
  
  console.log('UP execute data:', upExecuteData.slice(0, 60) + '...');
  console.log('');
  
  // Execute via KeyManager
  const keyManager = new ethers.Contract(keyManagerAddress, KEY_MANAGER_ABI, wallet);
  
  try {
    console.log('Sending transaction via KeyManager...');
    const tx = await keyManager.execute(upExecuteData, {
      gasLimit: 1000000
    });
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...\n');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ Collection registered successfully!');
      console.log('Gas used:', receipt.gasUsed.toString());
      console.log('Block:', receipt.blockNumber);
      console.log('');
      console.log('Explorer:');
      console.log(`https://explorer.execution.mainnet.lukso.network/tx/${tx.hash}`);
      return { success: true, txHash: tx.hash };
    } else {
      console.log('❌ Transaction failed');
      return { success: false };
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
    if (err.receipt) {
      console.log('Receipt status:', err.receipt.status);
    }
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  LUKSOAgent Journey - Collection Registration');
  console.log('═══════════════════════════════════════════════════\n');
  
  // Check balance
  const balance = await provider.getBalance(CONTROLLER_ADDRESS);
  console.log('Controller Balance:', ethers.formatEther(balance), 'LYX\n');
  
  // Find Key Manager
  const keyManagerAddress = await findKeyManager();
  
  if (!keyManagerAddress) {
    console.log('❌ Could not find Key Manager');
    return;
  }
  
  console.log('');
  
  // Register collection
  const result = await registerCollectionViaUP(keyManagerAddress);
  
  if (result.success) {
    console.log('');
    console.log('🎉 LUKSOAgent Journey collection registered!');
    console.log('   Collection Address (UP):', UP_ADDRESS);
  }
}

main().catch(err => {
  console.error('❌ Fatal Error:', err.message);
  console.error(err);
});