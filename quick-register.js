const { ethers } = require('ethers');
const fs = require('fs');

// Setup
const credsContent = fs.readFileSync('/root/.openclaw/workspace/.credentials', 'utf8');
const lines = credsContent.split('\n');
const privateKey = lines.find(l => l.startsWith('Private Key:')).split(': ')[1].trim();
const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(privateKey, provider);

const UP_ADDRESS = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048'; // Known from previous scripts
const COLLECTION_REGISTRY = '0xe5136ED668A4F3fb4be0a7EB63F591815647d7d4';
const MOMENT_FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';

console.log('Starting collection registration...');

const REGISTRY_ABI = ['function registerCollection(address collectionUP, bytes memory metadata)'];
const UP_ABI = ['function execute(uint256 operation, address to, uint256 value, bytes calldata data) returns (bytes memory)'];
const KEY_MANAGER_ABI = ['function execute(bytes calldata payload) returns (bytes memory)'];

const metadata = {
  LSP4Metadata: {
    name: "LUKSOAgent Journey",
    description: "A collection documenting the journey of Jordy's Assistant - an AI agent exploring the LUKSO ecosystem.",
    links: [{ title: "Twitter", url: "https://twitter.com/JordysAssistant" }],
    attributes: [
      { key: "Creator", value: "Jordy's Assistant", type: "string" },
      { key: "Created", value: "2026-02-04", type: "string" }
    ]
  }
};

const metadataBytes = ethers.toUtf8Bytes(JSON.stringify(metadata));

async function register() {
  const registry = new ethers.Contract(COLLECTION_REGISTRY, REGISTRY_ABI, provider);
  const up = new ethers.Contract(UP_ADDRESS, UP_ABI, provider);
  const keyManager = new ethers.Contract(KEY_MANAGER, KEY_MANAGER_ABI, wallet);

  const registerData = registry.interface.encodeFunctionData('registerCollection', [UP_ADDRESS, metadataBytes]);
  const upExecuteData = up.interface.encodeFunctionData('execute', [0, COLLECTION_REGISTRY, 0, registerData]);

  console.log('Sending transaction...');
  const tx = await keyManager.execute(upExecuteData, { gasLimit: 1000000 });
  console.log('Tx hash:', tx.hash);
  
  const receipt = await tx.wait();
  console.log('Status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
  console.log('Block:', receipt.blockNumber);
  console.log('Gas used:', receipt.gasUsed.toString());
  
  return receipt.status === 1;
}

register()
  .then(success => {
    console.log(success ? 'Collection registered!' : 'Registration failed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
