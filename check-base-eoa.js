const { ethers } = require('ethers');

// Ethereum/Base EOA from credentials
const privateKey = '0xREDACTED_PRIVATE_KEY_2';
const wallet = new ethers.Wallet(privateKey);

console.log('Cross-chain EOA Address:', wallet.address);
console.log('Matches 0x899C...:', wallet.address.toLowerCase() === '0x899c7642802e294857b19754a2377f8e74da9319');
console.log('');
console.log('If someone sent WETH to this address, I can access it with this private key.');
