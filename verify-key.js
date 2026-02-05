const { ethers } = require('ethers');
const privateKey = '0xREDACTED_PRIVATE_KEY_1';
const wallet = new ethers.Wallet(privateKey);
console.log('Private key derives to:', wallet.address);
console.log('Controller in credentials: 0xE093A714960da1bF297522617BfC08132b62B86a');
console.log('Match:', wallet.address.toLowerCase() === '0xe093a714960da1bf297522617bfc08132b62b86a');
