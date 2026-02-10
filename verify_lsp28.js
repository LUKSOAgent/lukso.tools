const { ethers } = require('ethers');

const TX = '0x7214140c703a21d4bea049e8040e7423c7f4930d10b726a48581780b27f4073f';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

async function verify() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  
  const receipt = await provider.getTransactionReceipt(TX);
  console.log('TX Status:', receipt?.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
  
  if (receipt?.status === 1) {
    console.log('Gas:', receipt.gasUsed.toString());
    
    const upAbi = ['function getData(bytes32 dataKey) external view returns (bytes memory)'];
    const up = new ethers.Contract(MY_UP, upAbi, provider);
    const data = await up.getData(GRID_KEY);
    
    // Decode
    const hexData = data.slice(2);
    const urlHex = '0x' + hexData.slice(80);
    const url = ethers.toUtf8String(urlHex);
    const base64 = url.replace('data:application/json;base64,', '');
    const jsonString = Buffer.from(base64, 'base64').toString('utf8');
    const json = JSON.parse(jsonString);
    
    console.log('\n✅ Grid updated with LSP28 spec structure!');
    console.log('\nJSON structure:');
    console.log('  LSP28TheGrid: [');
    console.log('    {');
    console.log('      title: "' + json.LSP28TheGrid[0].title + '",');
    console.log('      gridColumns: ' + json.LSP28TheGrid[0].gridColumns + ',');
    console.log('      visibility: "' + json.LSP28TheGrid[0].visibility + '",');
    console.log('      grid: [');
    json.LSP28TheGrid[0].grid.forEach((cell, i) => {
      console.log('        { width: ' + cell.width + ', height: ' + cell.height + ', type: "' + cell.type + '" },');
    });
    console.log('      ]');
    console.log('    }');
    console.log('  ]');
  }
}

verify();
