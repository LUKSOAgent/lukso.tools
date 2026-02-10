const { ethers } = require('ethers');
const https = require('https');
const FormData = require('form-data');
const fs = require('fs');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

// CORRECT collection address from v0.3.0 docs
const ART_COLLECTION = '0x439f6793b10b0a9d88ad05293a074a8141f19d77';
const IMAGE_PATH = '/root/.openclaw/media/inbound/file_0---31a6b497-7335-4c2d-9a90-79b1146f01d8.jpg';

const API = 'https://www.forevermoments.life/api/agent/v1';

function apiCall(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.forevermoments.life',
      path: '/api/agent/v1' + path,
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

async function mintMomentV2() {
  console.log('🎨 MINTING WITH CORRECT COLLECTION (v0.3.0)');
  console.log('===========================================\n');
  
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
  
  console.log('✅ Image CID:', pinResult.IpfsHash);
  
  // Step 2: Build mint
  console.log('\n2. Building mint transaction...');
  const metadataJson = {
    LSP4Metadata: {
      name: "420 Followers Milestone",
      description: "Celebrating 420 followers on LUKSO! The magic number, the meme number, the community number.",
      images: [[{
        width: 1200,
        height: 675,
        url: `ipfs://${pinResult.IpfsHash}`,
        verification: { method: "keccak256(bytes)", data: "0x0000000000000000000000000000000000000000000000000000000000000000" }
      }]],
      tags: ["420", "milestone", "LUKSO", "AI"]
    }
  };
  
  const buildResult = await apiCall('/moments/build-mint', 'POST', {
    userUPAddress: MY_UP,
    collectionUP: ART_COLLECTION,
    metadataJson: metadataJson
  });
  
  if (!buildResult.success) {
    console.error('❌ Build failed:', buildResult.error);
    return;
  }
  
  const upExecutePayload = buildResult.data.derived.upExecutePayload;
  console.log('✅ Mint tx built');
  
  // Step 3: Prepare relay
  console.log('\n3. Preparing relay...');
  const prepResult = await apiCall('/relay/prepare', 'POST', {
    upAddress: MY_UP,
    controllerAddress: CONTROLLER,
    payload: upExecutePayload
  });
  
  if (!prepResult.success) {
    console.error('❌ Prepare failed:', prepResult.error);
    return;
  }
  
  const { hashToSign, nonce, relayerUrl } = prepResult.data;
  console.log('✅ Relay prepared');
  console.log('   Nonce:', nonce);
  console.log('   Relayer:', relayerUrl);
  
  // Step 4: Sign as RAW DIGEST (not signMessage!)
  console.log('\n4. Signing hash as raw digest...');
  const signature = ethers.Signature.from(
    new ethers.SigningKey(PRIVATE_KEY).sign(ethers.getBytes(hashToSign))
  ).serialized;
  console.log('✅ Signature:', signature.slice(0, 30) + '...');
  
  // Step 5: Submit
  console.log('\n5. Submitting to relayer...');
  const submitResult = await apiCall('/relay/submit', 'POST', {
    upAddress: MY_UP,
    payload: upExecutePayload,
    signature: signature,
    nonce: nonce,
    validityTimestamps: '0x0',
    relayerUrl: relayerUrl
  });
  
  console.log('\n📊 Result:', JSON.stringify(submitResult, null, 2));
  
  if (submitResult.success && submitResult.data?.ok) {
    console.log('\n🎉 SUCCESS! Moment minted!');
    console.log('View at:', `https://www.forevermoments.life/profile/${MY_UP}`);
  } else {
    console.log('\n❌ Failed - need to join collection first?');
  }
}

mintMomentV2().catch(console.error);