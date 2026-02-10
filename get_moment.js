const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const TX = '0xb5be5354705cdfd1756f5a4c822e12137003cc86d9c0add57fed8e9261bbd780';

async function getMoment() {
  const receipt = await provider.getTransactionReceipt(TX);
  console.log('Logs:');
  for (const log of receipt.logs) {
    console.log('  Address:', log.address);
    console.log('  Topic:', log.topics[0]);
    console.log('  ---');
  }
}

getMoment();
