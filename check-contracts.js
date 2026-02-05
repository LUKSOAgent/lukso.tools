const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.mainnet.lukso.network';
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Check if contracts exist at the addresses
const addresses = {
  LSP23_FACTORY: '0x2300000a84d25dc630ce8a50e648e4f4f3514bc6',
  COLLECTION_REGISTRY: '0xe5136ed668a4f3fb4be0a7eb63f591815647d7d4',
  MOMENT_FACTORY: '0xef54710b5a78b4926104a65594539521eb440d37'
};

async function checkContracts() {
  for (const [name, address] of Object.entries(addresses)) {
    const code = await provider.getCode(address);
    console.log(`${name} (${address}):`);
    console.log(`  Code length: ${code.length}`);
    console.log(`  Has code: ${code !== '0x'}`);
    console.log();
  }
}

checkContracts().catch(console.error);
