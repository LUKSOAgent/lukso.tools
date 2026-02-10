const https = require('https');

const API_BASE = 'www.forevermoments.life';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';
const PRIVATE_KEY = '0xREDACTED_PRIVATE_KEY_1';

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

async function listCollections() {
  console.log('📚 Listing available collections...\n');
  const collections = await apiCall('/api/agent/v1/collections');
  console.log('Collections:', JSON.stringify(collections, null, 2));
  return collections;
}

listCollections().catch(console.error);
