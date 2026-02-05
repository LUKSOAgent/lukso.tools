const { ethers } = require('ethers');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';

// Check different derivation paths
console.log('Standard wallet from private key:');
const wallet = new ethers.Wallet(PRIVATE_KEY);
console.log('  Address:', wallet.address);

console.log('\nController address from credentials: 0x50Faa348A12841A6E2cc09C075d97b19F3DCf8C5');
console.log('Match:', wallet.address.toLowerCase() === '0x50faa348a12841a6e2cc09c075d97b19f3dcf8c5');

// Check if maybe the controller is the public key or something else
console.log('\nPublic key:', wallet.signingKey.publicKey);
console.log('Compressed public key:', wallet.signingKey.compressedPublicKey);
