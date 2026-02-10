const { ethers } = require('ethers');
const https = require('https');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

// CORRECT collection address from v0.3.0 docs
const ART_COLLECTION = '0x439f6793b10b0a9d88ad05293a074a8141f19d77';

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

async function joinCollection() {
  console.log('🔗 JOINING COLLECTION (v0.3.0)');
  console.log('==============================\n');
  console.log('Collection:', ART_COLLECTION);
  console.log('My UP:', MY_UP);
  
  // Step 1: Build join
  console.log('\n1. Building join...');
  const buildResult = await apiCall('/collections/build-join', 'POST', {
    userUPAddress: MY_UP,
    collectionUP: ART_COLLECTION
  });
  
  console.log('Build result:', JSON.stringify(buildResult, null, 2).slice(0, 500));
  
  if (!buildResult.success) {
    console.error('❌ Build failed:', buildResult.error);
    return;
  }
  
  const upExecutePayload = buildResult.data.derived.upExecutePayload;
  console.log('✅ Join tx built');
  
  // Step 2: Prepare relay
  console.log('\n2. Preparing relay...');
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
  
  // Step 3: Sign as RAW DIGEST
  console.log('\n3. Signing hash as raw digest...');
  const signature = ethers.Signature.from(
    new ethers.SigningKey(PRIVATE_KEY).sign(ethers.getBytes(hashToSign))
  ).serialized;
  console.log('✅ Signature:', signature.slice(0, 30) + '...');
  
  // Step 4: Submit
  console.log('\n4. Submitting to relayer...');
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
    console.log('\n🎉 SUCCESS! Joined collection!');
  } else {
    console.log('\n❌ Join failed - checking if already member...');
  }
}

joinCollection().catch(console.error);