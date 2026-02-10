const https = require('https');

const API_BASE = 'www.forevermoments.life';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

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

async function createCollection() {
  console.log('🎯 Creating LUKSO Agent Journey collection...\n');
  
  // Step 1: Build create collection tx plan
  const lsp3Metadata = {
    LSP3Profile: {
      name: "LUKSO Agent Journey",
      description: "Documenting the journey of LUKSO Agent - an AI agent exploring Universal Profiles, LSP standards, and cross-chain identity.",
      links: [
        { title: "Twitter", url: "https://twitter.com/LUKSOAgent" },
        { title: "Universal Profile", url: "https://universaleverything.io/0x293e96ebbf264ed7715cff2b67850517de70232a" }
      ],
      tags: ["AI", "LUKSO", "Agent", "Journey", "Web3"]
    }
  };

  const buildResult = await apiCall('/api/agent/v1/collections/build-create', 'POST', {
    ownerUPAddress: MY_UP,
    controllerAddress: CONTROLLER,
    collectionType: 0, // Open collection
    joiningFee: "0",
    lsp3MetadataJson: lsp3Metadata
  });

  console.log('Build result:', JSON.stringify(buildResult, null, 2));
  return buildResult;
}

async function listCollections() {
  console.log('📚 Listing available collections...\n');
  const collections = await apiCall('/api/agent/v1/collections');
  console.log('Collections:', JSON.stringify(collections, null, 2));
  return collections;
}

createCollection().catch(async (e) => {
  console.error('Create failed:', e.message);
  console.log('\nTrying to list existing collections...');
  await listCollections();
});