const { ethers } = require('ethers');
const https = require('https');

const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const KEY_MANAGER = '0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048';
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

// Correct LSP25 signing (EIP-191 v0)
function signLSP25(keyManagerAddress, chainId, nonce, validityTimestamps, msgValue, payload, privateKey) {
  const encodedMessage = ethers.solidityPacked(
    ['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes'],
    [25, chainId, nonce, validityTimestamps, msgValue, payload]
  );

  const prefix = new Uint8Array([0x19, 0x00]);
  const kmBytes = ethers.getBytes(keyManagerAddress);
  const msgBytes = ethers.getBytes(encodedMessage);
  const msg = new Uint8Array([...prefix, ...kmBytes, ...msgBytes]);
  const hash = ethers.keccak256(msg);

  const signature = ethers.Signature.from(new ethers.SigningKey(privateKey).sign(hash)).serialized;
  return signature;
}

async function joinCollection() {
  console.log('🔗 JOINING COLLECTION VIA RELAY');
  console.log('================================\n');
  
  // Step 1: Build join
  console.log('1. Building join...');
  const joinResult = await apiCall('/api/agent/v1/collections/build-join', 'POST', {
    userUPAddress: MY_UP,
    collectionUP: ART_COLLECTION
  });
  
  if (!joinResult.success) {
    console.error('Build failed:', joinResult.error);
    return;
  }
  
  console.log('✅ Join tx built');
  const upExecutePayload = joinResult.data.derived.upExecutePayload;
  
  // Step 2: Prepare relay
  console.log('\n2. Preparing relay...');
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
  const tx = relayPrepare.data.lsp15Request.transaction;
  
  // Step 3: Sign with correct LSP25
  console.log('\n3. Signing...');
  const signature = signLSP25(
    KEY_MANAGER,
    42, // LUKSO mainnet
    tx.nonce,
    tx.validityTimestamps,
    0,
    upExecutePayload,
    PRIVATE_KEY
  );
  
  console.log('Signature:', signature.slice(0, 50) + '...');
  
  // Step 4: Submit
  console.log('\n4. Submitting...');
  const relaySubmit = await apiCall('/api/agent/v1/relay/submit', 'POST', {
    upAddress: MY_UP,
    payload: upExecutePayload,
    signature: signature,
    nonce: tx.nonce,
    validityTimestamps: tx.validityTimestamps,
    relayerUrl: relayPrepare.data.relayerUrl
  });
  
  console.log('\nResult:', JSON.stringify(relaySubmit, null, 2));
}

joinCollection().catch(console.error);