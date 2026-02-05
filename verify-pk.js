const { ethers } = require('ethers');

// Private key from credentials
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';

// Derive the address from the private key
const wallet = new ethers.Wallet(PRIVATE_KEY);

console.log('Private Key Analysis:');
console.log('=====================\n');
console.log('Private Key:', PRIVATE_KEY);
console.log('Derived Address:', wallet.address);
console.log('');
console.log('Credentials Controller (from .credentials file):', '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5');
console.log('');
console.log('Match:', wallet.address.toLowerCase() === '0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5'.toLowerCase() ? '✅ YES' : '❌ NO');
