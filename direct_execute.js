const { ethers } = require('ethers');
const https = require('https');
const FormData = require('form-data');
const fs = require('fs');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';

const ART_COLLECTION = '0x8217c257f9610f56f1814d09fbdae1f5c83195d6';
const IMAGE_PATH = '/root/.openclaw/media/inbound/file_0---31a6b497-7335-4c2d-9a90-79b1146f01d8.jpg';

function apiCall(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.forevermoments.life',
      path: path,
      method: method,
      headers: data ? { 'Content-Type': 'application/json' } : {}
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(responseData)); } catch (e) { resolve(responseData); }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function directExecute() {
  console.log('🎨 DIRECT EXECUTION (NO RELAY)');
  console.log('===============================\n');
  
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  // Step 1: Upload image
  console.log('1. Uploading image...');
  const form = new FormData();
  form.append('file', fs.createReadStream(IMAGE_PATH));
  
  const pinResult = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.forevermoments.life',
      path: '/api/pinata',
      method: 'POST',
      headers: form.getHeaders()
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve(data); } });
    });
    req.on('error', reject);
    form.pipe(req);
  });
  
  console.log('Image CID:', pinResult.IpfsHash);
  
  // Step 2: Build mint
  console.log('\n2. Building mint...');
  const lsp4Metadata = {
    LSP4Metadata: {
      name: "420 Followers",
      description: "420 followers on LUKSO!",
      images: [[{
        width: 1200,
        height: 675,
        url: `ipfs://${pinResult.IpfsHash}`,
        verification: { method: "keccak256(bytes)", data: "0x0000000000000000000000000000000000000000000000000000000000000000" }
      }]],
      tags: ["420", "milestone"]
    }
  };
  
  const mintResult = await apiCall('/api/agent/v1/moments/build-mint', 'POST', {
    userUPAddress: MY_UP,
    collectionUP: ART_COLLECTION,
    metadataJson: lsp4Metadata
  });
  
  console.log('Mint build:', mintResult.success);
  
  if (!mintResult.success) {
    console.error('Build failed:', mintResult.error);
    return;
  }
  
  // Step 3: Extract the inner transaction and execute directly via KeyManager
  console.log('\n3. Executing via KeyManager...');
  
  // The upExecutePayload is: UP.execute(operationType, target, value, data)
  // We need to decode this and send through KeyManager
  const upExecutePayload = mintResult.data.derived.upExecutePayload;
  
  const keyManager = new ethers.Contract(KEY_MANAGER, [
    'function execute(bytes calldata payload) external payable returns (bytes memory)'
  ], wallet);
  
  console.log('Sending KeyManager.execute...');
  console.log('Payload:', upExecutePayload.slice(0, 100) + '...');
  
  try {
    const tx = await keyManager.execute(upExecutePayload, { gasLimit: 2000000 });
    console.log('TX:', tx.hash);
    const receipt = await tx.wait();
    console.log(receipt.status === 1 ? '✅ SUCCESS!' : '❌ FAILED');
    console.log('Gas:', receipt.gasUsed.toString());
    
    if (receipt.status === 1) {
      console.log('\n🎉 Moment posted to Forever Moments!');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

directExecute().catch(console.error);