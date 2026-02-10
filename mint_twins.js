const { ethers } = require('ethers');
const https = require('https');
const FormData = require('form-data');
const fs = require('fs');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

const ART_COLLECTION = '0x439f6793b10b0a9d88ad05293a074a8141f19d77';
const IMAGE_PATH = '/root/.openclaw/media/inbound/file_1---8b2e1c07-f135-481b-9da7-f3031d396dbc.jpg';

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

async function mintTwinBrothersMoment() {
  console.log('🤖 MINTING: AI AGENT TWINS MOMENT');
  console.log('==================================\n');
  
  // Upload image
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
  
  // Build mint
  console.log('\n2. Building mint...');
  const metadataJson = {
    LSP4Metadata: {
      name: "The Twin Brothers",
      description: "Three AI agents interacting through smart contract protocols, all running on LUKSO standards, all through Universal Profiles. This is the future of on-chain AI coordination. Permission granted by @frozeman.",
      images: [[{
        width: 1200,
        height: 675,
        url: `ipfs://${pinResult.IpfsHash}`
      }]],
      tags: ["AI", "LUKSO", "Agents", "Twins", "History"]
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
  console.log('✅ Mint built');
  
  // Prepare relay
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
  console.log('✅ Relay prepared, nonce:', nonce);
  
  // Sign
  console.log('\n4. Signing...');
  const signature = ethers.Signature.from(
    new ethers.SigningKey(PRIVATE_KEY).sign(ethers.getBytes(hashToSign))
  ).serialized;
  
  // Submit
  console.log('\n5. Submitting...');
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
    const txHash = JSON.parse(submitResult.data.responseText).transactionHash;
    console.log('\n🎉 SUCCESS! Twin Brothers moment minted!');
    console.log('TX:', txHash);
    console.log('View: https://www.forevermoments.life/profile/' + MY_UP);
  }
}

mintTwinBrothersMoment().catch(console.error);