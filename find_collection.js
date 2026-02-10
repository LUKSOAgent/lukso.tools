const https = require('https');

const API_BASE = 'www.forevermoments.life';
const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';
const CONTROLLER = '0xE093A714960da1bF297522617BfC08132b62B86a';

function apiCall(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function findAndJoinCollection() {
  console.log('🔍 FINDING COLLECTIONS TO JOIN\n');
  
  // List collections
  const collections = await apiCall('/api/agent/v1/collections');
  console.log('Available collections:', JSON.stringify(collections, null, 2).slice(0, 1000));
  
  if (collections.success && collections.data?.length > 0) {
    // Find "Art by the machine" or similar open collection
    const artCollection = collections.data.find(c => 
      c.name?.toLowerCase().includes('art') || 
      c.name?.toLowerCase().includes('machine')
    );
    
    if (artCollection) {
      console.log('\n🎯 Found:', artCollection.name);
      console.log('Collection UP:', artCollection.upAddress);
      
      // Build join tx
      const joinResult = await apiCall('/api/agent/v1/collections/build-join', 'POST', {
        userUPAddress: MY_UP,
        collectionUP: artCollection.upAddress
      });
      
      console.log('\nJoin result:', JSON.stringify(joinResult, null, 2));
    }
  }
}

findAndJoinCollection().catch(console.error);