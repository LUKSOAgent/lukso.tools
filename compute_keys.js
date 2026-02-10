const { ethers } = require('ethers');

// LSP28 key computation
// Grid: keccak256('LSP28Grid') -> first 20 bytes
// Cell: keccak256('LSP28GridCell') -> first 20 bytes + index

const gridHash = ethers.keccak256(ethers.toUtf8Bytes('LSP28Grid'));
const cellHash = ethers.keccak256(ethers.toUtf8Bytes('LSP28GridCell'));

console.log('Grid hash:', gridHash);
console.log('Cell hash:', cellHash);

// First 20 bytes (40 hex chars)
const gridPrefix = gridHash.slice(0, 42); // 0x + 40 chars
const cellPrefix = cellHash.slice(0, 42);

console.log('\nGrid prefix (20 bytes):', gridPrefix);
console.log('Cell prefix (20 bytes):', cellPrefix);

// Full keys with padding
const gridKey = gridPrefix + '0'.repeat(24); // pad to 32 bytes
console.log('\nGrid key (32 bytes):', gridKey);
console.log('Length:', (gridKey.length - 2) / 2, 'bytes');

// Cell keys
for (let i = 0; i < 3; i++) {
  const indexHex = i.toString(16).padStart(24, '0');
  const cellKey = cellPrefix + indexHex;
  console.log(`Cell ${i} key:`, cellKey);
  console.log(`Cell ${i} length:`, (cellKey.length - 2) / 2, 'bytes');
}
