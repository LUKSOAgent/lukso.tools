const { ethers } = require('ethers');

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  // Bridged USDC contract
  const USDC = '0xe0c2e4f894d4cd33626e33b24582559f3156e1ab';
  const LSP4_METADATA_KEY = '0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415623afcccd8593c8b19';
  
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(USDC, upAbi, provider);
  
  const data = await up.getData(LSP4_METADATA_KEY);
  
  console.log('Bridged USDC LSP4Metadata:');
  console.log('Full value (first 200 chars):', data.slice(0, 200));
  console.log('Starts with:', data.slice(0, 20));
  console.log('Length:', data.length);
  console.log('');
  
  // Parse it
  console.log('Parsing:');
  console.log('Identifier (2 bytes):', data.slice(2, 6));
  console.log('Verification method (4 bytes):', data.slice(6, 14));
  console.log('Data length (2 bytes):', data.slice(14, 18));
}

check();
