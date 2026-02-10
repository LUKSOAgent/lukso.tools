const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function confirm() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  // Verify the key is correct
  const correctKey = ethers.keccak256(ethers.toUtf8Bytes('LSP28TheGrid'));
  console.log('keccak256("LSP28TheGrid"):', correctKey);
  console.log('My key:', GRID_KEY);
  console.log('Match:', correctKey.toLowerCase() === GRID_KEY.toLowerCase());
  console.log('');
  
  // Check data at this key
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  const data = await up.getData(GRID_KEY);
  
  console.log('Data at this key:');
  console.log('Has data:', data.length > 2 ? 'YES' : 'NO');
  console.log('First 60 chars:', data.slice(0, 60));
}

confirm();
