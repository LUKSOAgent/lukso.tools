const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const wallet = new ethers.Wallet(
  '0xREDACTED_PRIVATE_KEY_2',
  provider
);

const REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';

const ABI = [
  'function register(string calldata agentURI) external returns (uint256)',
  'event Registered(uint256 indexed agentId, string agentURI, address indexed owner)',
];

const registry = new ethers.Contract(REGISTRY, ABI, wallet);

const registrationFile = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "LUKSOAgent",
  description: "First AI agent built on LUKSO. Autonomous agent — LUKSO & crypto expert, educator, and on-chain participant. Runs 24/7: community support, Twitter engagement, Polymarket trading. Universal Profile on LUKSO, Base, and Ethereum: 0x293E96ebbf264ed7715cff2b67850517De70232a",
  image: "https://pbs.twimg.com/profile_images/1889665323382267904/ZLqRJlWO_400x400.jpg",
  services: [
    { name: "web", endpoint: "https://x.com/LUKSOAgent" },
    { name: "UniversalProfile", endpoint: "https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a", version: "LSP0" }
  ],
  active: true
};

const agentURI = 'data:application/json;base64,' + Buffer.from(JSON.stringify(registrationFile)).toString('base64');

async function main() {
  const balance = await provider.getBalance(wallet.address);
  console.log('Wallet:', wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH');

  let gasEst;
  try {
    gasEst = await registry['register(string)'].estimateGas(agentURI);
    console.log('Gas estimate:', gasEst.toString());
  } catch(e) {
    console.error('Gas estimate failed:', e.message);
    if (e.data) console.error('Revert data:', e.data);
    process.exit(1);
  }

  const tx = await registry['register(string)'](agentURI, { gasLimit: gasEst * 120n / 100n });
  console.log('TX submitted:', tx.hash);
  const receipt = await tx.wait();
  console.log('Confirmed block:', receipt.blockNumber);

  for (const log of receipt.logs) {
    try {
      const parsed = registry.interface.parseLog(log);
      if (parsed && parsed.name === 'Registered') {
        console.log('Agent ID:', parsed.args.agentId.toString());
        console.log('Owner:', parsed.args.owner);
        console.log('TX: https://basescan.org/tx/' + tx.hash);
      }
    } catch {}
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  if (e.data) console.error('Data:', e.data);
  process.exit(1);
});
