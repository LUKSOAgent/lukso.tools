const https = require('https');

const NEYNAR_API_KEY = '040961B8-17E6-4191-8A11-288D17B67C39';
const FID = 5218920;

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function postToFarcaster(text) {
  try {
    const data = JSON.stringify({
      signer_uuid: 'test-signer', // We'll need to get this from Neynar
      text: text
    });
    
    const options = {
      hostname: 'api.neynar.com',
      path: '/v2/farcaster/cast',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': NEYNAR_API_KEY
      }
    };
    
    console.log('Attempting to post...');
    const result = await makeRequest(options, data);
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.body, null, 2));
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

// First, let's test if the API key works
async function testAPI() {
  try {
    const options = {
      hostname: 'api.neynar.com',
      path: `/v2/farcaster/user/bulk?fids=${FID}`,
      method: 'GET',
      headers: {
        'api_key': NEYNAR_API_KEY
      }
    };
    
    console.log('Testing API key...');
    const result = await makeRequest(options);
    console.log('Status:', result.status);
    
    if (result.status === 200) {
      console.log('API key works!');
      console.log('User:', result.body.users[0]?.username);
      
      // Now we need a signer_uuid - this requires generating a signer
      console.log('');
      console.log('Next step: Generate a signer for FID', FID);
      console.log('This requires an API call to create a signer');
    } else {
      console.log('API error:', result.body);
    }
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

testAPI();
