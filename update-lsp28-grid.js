const { ethers } = require('ethers');
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

// Configuration
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

const RPC_URL = 'https://rpc.mainnet.lukso.network';

// Pin JSON to IPFS via Forever Moments
async function pinJSONToIPFS(jsonData) {
  console.log('📤 Pinning LSP28 JSON to IPFS...');
  
  const FormData = require('form-data');
  const form = new FormData();
  
  // Create a buffer from JSON
  const jsonBuffer = Buffer.from(JSON.stringify(jsonData));
  form.append('file', jsonBuffer, 'lsp28-grid.json');
  
  const result = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.forevermoments.life',
      path: '/api/pinata',
      method: 'POST',
      headers: form.getHeaders()
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { 
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); } 
      });
    });
    req.on('error', reject);
    form.pipe(req);
  });
  
  if (!result.IpfsHash) {
    throw new Error('Failed to pin JSON: ' + JSON.stringify(result));
  }
  
  console.log('✅ JSON CID:', result.IpfsHash);
  return result.IpfsHash;
}

async function updateLSP28Grid() {
  console.log('🎯 UPDATING LSP28 GRID ON UNIVERSAL PROFILE');
  console.log('==========================================\n');
  
  // Read grid data
  const gridData = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/lsp28-grid-updated.json', 'utf8'));
  
  // Pin to IPFS
  const cid = await pinJSONToIPFS(gridData);
  const url = `ipfs://${cid}`;
  
  console.log('\nURL:', url);
  
  // Encode VerifiableURI
  // Format: 0x + 0000 + 6f357c6a + 0020 + <keccak256 hash> + <url hex>
  const jsonBytes = Buffer.from(JSON.stringify(gridData));
  const jsonHash = ethers.keccak256(jsonBytes);
  const urlHex = Buffer.from(url, 'utf8').toString('hex');
  const verifiableURI = '0x00006f357c6a0020' + jsonHash.slice(2) + urlHex;
  
  console.log('VerifiableURI:', verifiableURI.slice(0, 60) + '...');
  
  // LSP28 data key
  const LSP28_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';
  
  // Encode setData call
  const upInterface = new ethers.Interface([
    'function setData(bytes32 dataKey, bytes dataValue)'
  ]);
  const setDataPayload = upInterface.encodeFunctionData('setData', [LSP28_KEY, verifiableURI]);
  
  // Connect to KeyManager
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const km = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  console.log('\nSending transaction...');
  const tx = await km.execute(setDataPayload);
  console.log('Transaction sent:', tx.hash);
  
  const receipt = await tx.wait();
  console.log('\n✅ LSP28 Grid updated!');
  console.log('Transaction:', receipt.hash);
  console.log('Block:', receipt.blockNumber);
  console.log('\nProfile:', 'https://universaleverything.io/' + MY_UP);
}

updateLSP28Grid().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
