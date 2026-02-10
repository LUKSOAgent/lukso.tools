const { ethers } = require('ethers');

const key = ethers.keccak256(ethers.toUtf8Bytes('LSP28TheGrid'));
console.log('LSP28TheGrid key:', key);

const myKey = '0x68b6a8dea50000008fe600000000000000000000000000000000000000000000';
console.log('My key:', myKey);
console.log('Match:', key.toLowerCase() === myKey.toLowerCase());
