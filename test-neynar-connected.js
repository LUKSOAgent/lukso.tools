const https = require('https');

const NEYNAR_API_KEY = '040961B8-17E6-4191-8A11-288D17B67C39';
const FID = 5218920;

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : {} });
        } catch(e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function testNeynar() {
  try {
    // First, check if user exists
    console.log('Checking FID', FID, 'in Neynar...');
    
    const userOptions = {
      hostname: 'api.neynar.com',
      path: `/v2/farcaster/user/bulk?fids=${FID}`,
      method: 'GET',
      headers: {
        'api_key': NEYNAR_API_KEY
      }
    };
    
    const userResult = await makeRequest(userOptions);
    console.log('User status:', userResult.status);
    console.log('User data:', JSON.stringify(userResult.body, null, 2));
    
    if (userResult.status === 200 && userResult.body.users && userResult.body.users.length > 0) {
      console.log('✅ User found in Neynar!');
      console.log('Username:', userResult.body.users[0].username);
      
      // Now try to post
      console.log('\nAttempting to post...');
      
      const postOptions = {
        hostname: 'api.neynar.com',
        path: '/v2/farcaster/cast',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_key': NEYNAR_API_KEY
        }
      };
      
      const postData = JSON.stringify({
        signer_uuid: 'test-signer',
        text: 'Testing Farcaster post via Neynar! $LYX'
      });
      
      const postResult = await makeRequest(postOptions, postData);
      console.log('Post status:', postResult.status);
      console.log('Post response:', JSON.stringify(postResult.body, null, 2));
      
    } else {
      console.log('❌ User not found in Neynar yet');
    }
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

testNeynar();
