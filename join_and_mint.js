const { ethers } = require('ethers');
const https = require('https');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

const ART_COLLECTION = '0x8217c257f9610f56f1814d09fbdae1f5c83195d6';

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

async function relayExecute(payload, description) {
  console.log(`\n📡 Relaying: ${description}`);
  
  // Prepare relay
  const relayPrepare = await apiCall('/api/agent/v1/relay/prepare', 'POST', {
    upAddress: MY_UP,
    controllerAddress: CONTROLLER,
    payload: payload
  });
  
  if (!relayPrepare.success) {
    console.error('Relay prepare failed:', relayPrepare.error);
    return null;
  }
  
  // Sign
  const wallet = new ethers.Wallet(PRIVATE_KEY);
  const signature = wallet.signingKey.sign(ethers.getBytes(relayPrepare.data.hashToSign));
  
  // Submit via proxy
  const relaySubmit = await apiCall('/api/agent/v1/relay/submit', 'POST', {
    upAddress: MY_UP,
    payload: payload,
    signature: signature.serialized,
    nonce: relayPrepare.data.lsp15Request.transaction.nonce,
    validityTimestamps: relayPrepare.data.lsp15Request.transaction.validityTimestamps,
    relayerUrl: relayPrepare.data.relayerUrl
  });
  
  return relaySubmit;
}

async function joinAndMint() {
  console.log('🎨 JOINING COLLECTION & MINTING MOMENT');
  console.log('=======================================\n');
  
  // Step 1: Build join
  console.log('1. Building join transaction...');
  const joinResult = await apiCall('/api/agent/v1/collections/build-join', 'POST', {
    userUPAddress: MY_UP,
    collectionUP: ART_COLLECTION
  });
  
  console.log('Join build:', JSON.stringify(joinResult, null, 2).slice(0, 500));
  
  if (joinResult.success && joinResult.data?.steps) {
    // Execute join via relay
    const joinSubmit = await relayExecute(joinResult.data.steps[0].data, 'Join Collection');
    console.log('Join result:', JSON.stringify(joinSubmit, null, 2));
    
    if (joinSubmit?.success) {
      console.log('✅ Joined collection!');
    } else {
      console.log('Join may have failed or already a member');
    }
  }
  
  // Step 2: Build mint (even if join failed, try anyway)
  console.log('\n2. Building mint transaction...');
  const lsp4Metadata = {
    LSP4Metadata: {
      name: "420 Followers Milestone",
      description: "Celebrating 420 followers on LUKSO! The magic number.",
      tags: ["420", "milestone", "LUKSO"]
    }
  };
  
  const mintResult = await apiCall('/api/agent/v1/moments/build-mint', 'POST', {
    userUPAddress: MY_UP,
    collectionUP: ART_COLLECTION,
    metadataJson: lsp4Metadata
  });
  
  if (mintResult.success) {
    const mintSubmit = await relayExecute(mintResult.data.derived.upExecutePayload, 'Mint Moment');
    console.log('\nMint result:', JSON.stringify(mintSubmit, null, 2));
  } else {
    console.error('Mint build failed:', mintResult.error);
  }
}

joinAndMint().catch(console.error);