const { ethers } = require('ethers');

const TX = '0xe2eeeee6e556554bffdba17c5ff38925c4037cf0cba4bff9b6f72469926e61e4';
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
    
    console.log('\nGrid data starts with:', data.slice(0, 50));
    console.log('Should start with: 0x00008019f9b10020...');
    
    // Decode
    const hexData = data.slice(2);
    const urlHex = '0x' + hexData.slice(80);
    const url = ethers.toUtf8String(urlHex);
    const base64 = url.replace('data:application/json;base64,', '');
    const jsonString = Buffer.from(base64, 'base64').toString('utf8');
    const json = JSON.parse(jsonString);
    
    console.log('\n✅ JSON structure:');
    console.log('  title:', json.title);
    console.log('  gridColumns:', json.gridColumns);
    console.log('  visibility:', json.visibility);
    console.log('  grid items:', json.grid.length);
  }
}

verify();
