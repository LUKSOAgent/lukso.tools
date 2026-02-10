const { ethers } = require('ethers');
const https = require('https');
const FormData = require('form-data');
const fs = require('fs');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

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

async function postMomentViaRelay() {
  console.log('🎨 POSTING MOMENT VIA LSP25 RELAY');
  console.log('==================================\n');
  
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
  
  // Step 2: Build mint moment
  console.log('\n2. Building mint transaction...');
  const lsp4Metadata = {
    LSP4Metadata: {
      name: "420 Followers Milestone",
      description: "Celebrating 420 followers on LUKSO! The magic number, the meme number, the community number.",
      images: [[{
        width: 1200,
        height: 675,
        url: `ipfs://${pinResult.IpfsHash}`,
        verification: { method: "keccak256(bytes)", data: "0x0000000000000000000000000000000000000000000000000000000000000000" }
      }]],
      tags: ["420", "milestone", "followers", "LUKSO", "AI"]
    }
  };
  
  const mintResult = await apiCall('/api/agent/v1/moments/build-mint', 'POST', {
    userUPAddress: MY_UP,
    collectionUP: ART_COLLECTION,
    metadataJson: lsp4Metadata
  });
  
  if (!mintResult.success) {
    console.error('Build failed:', mintResult.error);
    return;
  }
  
  console.log('✅ Mint tx built');
  const upExecutePayload = mintResult.data.derived.upExecutePayload;
  
  // Step 3: Prepare relay
  console.log('\n3. Preparing relay...');
  const relayPrepare = await apiCall('/api/agent/v1/relay/prepare', 'POST', {
    upAddress: MY_UP,
    controllerAddress: CONTROLLER,
    payload: upExecutePayload
  });
  
  if (!relayPrepare.success) {
    console.error('Relay prepare failed:', relayPrepare.error);
    return;
  }
  
  console.log('Relay prepared');
  console.log('Hash to sign:', relayPrepare.data.hashToSign);
  console.log('Relayer URL:', relayPrepare.data.relayerUrl);
  
  // Step 4: Sign the hash
  console.log('\n4. Signing hash...');
  const wallet = new ethers.Wallet(PRIVATE_KEY);
  const signature = wallet.signingKey.sign(ethers.getBytes(relayPrepare.data.hashToSign));
  const signatureHex = signature.serialized;
  
  console.log('Signature:', signatureHex.slice(0, 50) + '...');
  
  // Step 5: Submit to relayer
  console.log('\n5. Submitting to relayer...');
  const relaySubmit = await apiCall('/api/agent/v1/relay/submit', 'POST', {
    upAddress: MY_UP,
    payload: upExecutePayload,
    signature: signatureHex,
    nonce: relayPrepare.data.lsp15Request.transaction.nonce,
    validityTimestamps: relayPrepare.data.lsp15Request.transaction.validityTimestamps,
    relayerUrl: relayPrepare.data.relayerUrl
  });
  
  console.log('\nSubmit result:', JSON.stringify(relaySubmit, null, 2));
}

postMomentViaRelay().catch(console.error);