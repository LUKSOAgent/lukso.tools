const https = require('https');

const API_BASE = 'www.forevermoments.life';

// Helper to make API calls
function apiCall(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function finalizeCollection() {
  console.log('🎯 FINALIZING COLLECTION CREATION');
  console.log('================================\n');
  
  const DEPLOY_TX = '0x2a02e33ac62380e3ee828b3a00efe66e7e8c248f983246bfd175d51dd0d9a83f';
  const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
  
  const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
  
  const finalizeResult = await apiCall('/api/agent/v1/collections/finalize-create', 'POST', {
    deployTxHash: DEPLOY_TX,
    controllerAddress: CONTROLLER,
    ownerUPAddress: MY_UP,
    collectionType: 0
  });
  
  console.log('Finalize result:', JSON.stringify(finalizeResult, null, 2));
  
  if (finalizeResult.success && finalizeResult.data?.steps) {
    console.log('\n✅ Collection created!');
    console.log('Collection UP:', finalizeResult.data.derived?.collectionUPAddress);
    console.log('\nNext: execute the register step via KeyManager');
  }
}

finalizeCollection().catch(console.error);