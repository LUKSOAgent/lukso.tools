const { ethers } = require('ethers');
const https = require('https');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

// New collection for LUKSO Agent journey
const AGENT_JOURNEY_COLLECTION = '0xe386609eb58d2f8a618949a5e45fe79d165ca74b';

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

async function joinAgentJourney() {
  console.log('🤖 JOINING: LUKSO Agent Journey Collection');
  console.log('==========================================\n');
  console.log('Collection:', AGENT_JOURNEY_COLLECTION);
  
  // Build join
  console.log('\n1. Building join...');
  const buildResult = await apiCall('/collections/build-join', 'POST', {
    userUPAddress: MY_UP,
    collectionUP: AGENT_JOURNEY_COLLECTION
  });
  
  if (!buildResult.success) {
    console.error('❌ Build failed:', buildResult.error);
    return;
  }
  
  const upExecutePayload = buildResult.data.derived.upExecutePayload;
  console.log('✅ Join tx built');
  
  // Prepare relay
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
  
  // Sign
  console.log('\n3. Signing...');
  const signature = ethers.Signature.from(
    new ethers.SigningKey(PRIVATE_KEY).sign(ethers.getBytes(hashToSign))
  ).serialized;
  
  // Submit
  console.log('\n4. Submitting...');
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
    console.log('\n🎉 SUCCESS! Joined LUKSO Agent Journey collection!');
    console.log('TX:', txHash);
    console.log('\nGoing forward:');
    console.log('• "Art by the Machine" → AI artwork only');
    console.log('• "LUKSO Agent Journey" → milestones, journey, LUKSO-related moments');
  }
}

joinAgentJourney().catch(console.error);