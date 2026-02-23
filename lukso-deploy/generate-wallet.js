import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs';

// Generate a new wallet
const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log('🔑 Wallet generated:');
console.log('  Address:', account.address);
console.log('  Private Key:', privateKey);
console.log('');
console.log('⚠️  Please fund this address with some LYXt (LUKSO testnet tokens)');
console.log('   You can get testnet LYX from the LUKSO testnet faucet:');
console.log('   https://faucet.testnet.lukso.network/');
console.log('');

// Save wallet info to file
fs.writeFileSync('wallet.json', JSON.stringify({
  address: account.address,
  privateKey: privateKey
}, null, 2));

console.log('💾 Wallet info saved to wallet.json');
