const { ethers } = require('ethers');

const TX = '0x24ab02733c1d74f419b531a4a9d797d9e443c288885cfa0805c505cb5f7cc2ac';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function verify() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const receipt = await provider.getTransactionReceipt(TX);
  console.log('TX Status:', receipt?.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
  
  if (receipt?.status === 1) {
    const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
    const up = new ethers.Contract(MY_UP, upAbi, provider);
    const data = await up.getData(GRID_KEY);
    
    console.log('\nGrid data:');
    console.log('First 80 chars:', data.slice(0, 80));
    console.log('Length:', data.length);
    console.log('');
    console.log('Expected format: 0x00006f357c6a<hash>03fc<base64>');
    console.log('Actual starts with:', data.slice(0, 20));
    
    // Parse
    const identifier = data.slice(2, 6);
    const method = data.slice(6, 14);
    const hash = data.slice(14, 78);
    const length = data.slice(78, 82);
    
    console.log('\nParsed:');
    console.log('Identifier:', identifier, '(should be 0000)');
    console.log('Method:', method, '(should be 6f357c6a)');
    console.log('Hash:', hash.slice(0, 20) + '...');
    console.log('Length:', length, '(should be 03fc = 1020)');
  }
}

verify();
