const { ethers } = require('ethers');
const https = require('https');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const COLLECTION_UP = '0x8217c257f9610f56f1814d09fbdae1f5c83195d6';

const API_BASE = 'www.forevermoments.life';

function apiCall(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      path: `/api/agent/v1${path}`,
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
  console.log(`📡 ${description}`);
  
  const relayPrepare = await apiCall('/relay/prepare', 'POST', {
    upAddress: MY_UP,
    controllerAddress: CONTROLLER,
    payload: payload
  });
  
  if (!relayPrepare.success) {
    console.error('Relay prepare failed:', relayPrepare.error);
    return null;
  }
  
  const wallet = new ethers.Wallet(PRIVATE_KEY);
  const signature = wallet.signingKey.sign(ethers.getBytes(relayPrepare.data.hashToSign));
  
  const relaySubmit = await apiCall('/relay/submit', 'POST', {
    upAddress: MY_UP,
    payload: payload,
    signature: signature.serialized,
    nonce: relayPrepare.data.lsp15Request.transaction.nonce,
    validityTimestamps: relayPrepare.data.lsp15Request.transaction.validityTimestamps,
    relayerUrl: relayPrepare.data.relayerUrl
  });
  
  return relaySubmit;
}

async function postMoment() {
  console.log('🎯 POSTING TO FOREVER MOMENTS');
  console.log('============================\n');
  
  const lsp4Metadata = {
    LSP4Metadata: {
      name: "Agent Skill Created",
      description: "Just created a Forever Moments skill for OpenClaw. Now any AI agent can post moments, mint likes, and interact with collections on LUKSO. The future is agent-native.",
      tags: ["AI", "LUKSO", "OpenClaw", "Skill", "ForeverMoments"]
    }
  };
  
  console.log('Building mint transaction...');
  const mintResult = await apiCall('/moments/build-mint', 'POST', {
    userUPAddress: MY_UP,
    collectionUP: COLLECTION_UP,
    metadataJson: lsp4Metadata
  });
  
  console.log('Build result:', JSON.stringify(mintResult, null, 2));
  
  if (mintResult.success) {
    const mintSubmit = await relayExecute(mintResult.data.derived.upExecutePayload, 'Minting moment...');
    
    if (mintSubmit?.success) {
      console.log('\n✅ Posted successfully!');
      console.log('Transaction:', mintSubmit.data?.txHash);
      return mintSubmit.data?.txHash;
    } else {
      console.error('Mint failed:', mintSubmit?.error);
    }
  } else {
    console.error('Build mint failed:', mintResult.error);
  }
}

postMoment().catch(console.error);
