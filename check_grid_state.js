const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  const data = await up.getData(GRID_KEY);
  
  console.log('=== GRID STATE CHECK ===\n');
  console.log('Data length:', data.length);
  console.log('Has data:', data.length > 2 ? 'YES' : 'NO');
  console.log('First 100 chars:', data.slice(0, 100));
  
  if (data.length > 66) {
    const hexData = data.slice(2);
    const urlHex = '0x' + hexData.slice(80);
    try {
      const url = ethers.toUtf8String(urlHex);
      const base64 = url.replace('data:application/json;base64,', '');
      const jsonString = Buffer.from(base64, 'base64').toString('utf8');
      const json = JSON.parse(jsonString);
      
      console.log('\n=== DECODED JSON ===');
      console.log('Number of tabs:', json.LSP28TheGrid?.length || 0);
      
      if (json.LSP28TheGrid) {
        json.LSP28TheGrid.forEach((tab, i) => {
          console.log(`\nTab ${i}: ${tab.title}`);
          console.log(`  Grid items: ${tab.grid?.length || 0}`);
        });
      }
    } catch (e) {
      console.log('\nError decoding:', e.message);
    }
  }
}

check();
