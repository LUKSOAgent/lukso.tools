const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');

// One of the successful mint transactions
const TX_HASH = '0x39933f4e5e16802b446dbaf22ed1b4c42c52744084559b10fa7a6f4c4192d73e';
const FACTORY = '0xEF54710b5A78B4926104a65594539521EB440D37';

async function analyzeMintTransaction() {
  console.log('🔍 Analyzing successful mint transaction\n');
  console.log('TX:', TX_HASH);
  console.log('');
  
  // Get transaction
  const tx = await provider.getTransaction(TX_HASH);
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  
  console.log('Transaction Details:');
  console.log('  From:', tx.from);
  console.log('  To:', tx.to);
  console.log('  Data length:', tx.data.length, 'characters');
  console.log('  Gas Limit:', tx.gasLimit.toString());
  console.log('  Gas Used:', receipt.gasUsed.toString());
  console.log('');
  
  // Check if To address is a contract
  const toCode = await provider.getCode(tx.to);
  console.log('To address is contract:', toCode.length > 2);
  console.log('');
  
  // Analyze the transaction data
  console.log('Transaction Data (first 200 chars):');
  console.log(tx.data.slice(0, 200) + '...');
  console.log('');
  
  // Get logs
  console.log('Transaction Logs:');
  for (let i = 0; i < receipt.logs.length; i++) {
    const log = receipt.logs[i];
    console.log(`\n  Log [${i}]:`);
    console.log('    Address:', log.address);
    console.log('    Topics:', log.topics.map(t => t.slice(0, 20) + '...'));
    console.log('    Data length:', log.data.length);
    
    // Check if it's from factory
    if (log.address.toLowerCase() === FACTORY.toLowerCase()) {
      console.log('    ⭐ This is from the Factory!');
    }
  }
  
  console.log('\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('Analysis:');
  console.log('═══════════════════════════════════════════════════');
  
  // The transaction went to a different address than factory
  // It might be a collection contract or user's UP calling the factory
  
  if (tx.to.toLowerCase() !== FACTORY.toLowerCase()) {
    console.log('Transaction did NOT go directly to Factory');
    console.log('Target:', tx.to);
    console.log('');
    console.log('Possible explanations:');
    console.log('  1. Collection contract proxies to factory');
    console.log('  2. User UP calls factory through KeyManager');
    console.log('  3. Different proxy mechanism');
    console.log('');
    
    // Check if target has factory as a member
    console.log('Checking if target contract references factory...');
    
    // Look for factory address in the contract bytecode
    const factoryBytes = FACTORY.slice(2).toLowerCase();
    const codeLower = toCode.toLowerCase();
    const hasFactoryRef = codeLower.includes(factoryBytes);
    console.log('Contract references factory:', hasFactoryRef);
  }
  
  // Check the event from factory
  const factoryLog = receipt.logs.find(l => l.address.toLowerCase() === FACTORY.toLowerCase());
  if (factoryLog) {
    console.log('\n⭐ Factory Event Found:');
    console.log('  Topics:', factoryLog.topics);
    
    // Decode MomentMinted event
    // MomentMinted(address moment, bytes32 tokenId, address collectionUP)
    const momentAddress = '0x' + factoryLog.topics[1].slice(-40);
    const tokenId = factoryLog.topics[2];
    const collectionUP = '0x' + factoryLog.topics[3].slice(-40);
    
    console.log('  Decoded:');
    console.log('    Moment Address:', momentAddress);
    console.log('    Token ID:', tokenId);
    console.log('    Collection UP:', collectionUP);
  }
}

analyzeMintTransaction().catch(console.error);