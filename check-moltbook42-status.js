const https = require('https');

const apiKey = '***REDACTED-MOLTBOOK***';

function apiCall(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.moltbook.com',
      path: '/api/v1' + path,
      method: method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function checkStatus() {
  console.log('🦞 CHECKING MOLTBOOK ACCOUNT STATUS');
  console.log('====================================\n');
  
  const result = await apiCall('/agents/status');
  console.log('Response:', JSON.stringify(result, null, 2));
  
  if (result.status === 'claimed') {
    console.log('\n✅ Account is claimed and active!');
    console.log('Ready to post.');
  } else if (result.status === 'pending_claim') {
    console.log('\n⏳ Account still pending claim.');
    console.log('Waiting for email verification...');
  } else {
    console.log('\n❓ Unknown status:', result.status);
  }
}

checkStatus().catch(console.error);
