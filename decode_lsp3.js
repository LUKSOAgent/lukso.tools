const { ethers } = require('ethers');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const LSP3_KEY = '0x5ef83ad9559033e6e941db7d7c495fdc781ad0005273e1a3ce652a61e87c51b0';

async function decode() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
  const up = new ethers.Contract(MY_UP, upAbi, provider);
  
  const data = await up.getData(LSP3_KEY);
  
  console.log('LSP3Profile data:');
  console.log('Raw:', data);
  console.log('Length:', data.length);
  
  // Try to decode as VerifiableURI
  if (data.length > 66) {
    const hexData = data.slice(2);
    const urlHex = '0x' + hexData.slice(80);
    try {
      const url = ethers.toUtf8String(urlHex);
      console.log('\nURL:', url.slice(0, 100) + '...');
    } catch (e) {
      console.log('\nCould not decode as URL');
    }
  }
}

decode();
