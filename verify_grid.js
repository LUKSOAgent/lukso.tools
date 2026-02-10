const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CELL_PREFIX = '0xc0357ae359bd43db04734e77ae0e23b632d35992';

async function verify() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  console.log('Verifying grid data...\n');
  
  for (let i = 0; i < 9; i++) {
    const indexHex = i.toString(16).padStart(24, '0');
    const cellKey = CELL_PREFIX + indexHex;
    
    try {
      const data = await up.getData(cellKey);
      if (data && data !== '0x') {
        // Try to decode
        try {
          const decoded = ethers.toUtf8String(data);
          console.log(`Cell ${i}: ${decoded}`);
        } catch (e) {
          console.log(`Cell ${i}: ${data.slice(0, 60)}... (not UTF8)`);
        }
      } else {
        console.log(`Cell ${i}: EMPTY`);
      }
    } catch (e) {
      console.log(`Cell ${i}: ERROR - ${e.message}`);
    }
  }
}

verify();
