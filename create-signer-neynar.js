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

async function createSigner() {
  try {
    console.log('Creating signer for FID:', FID);
    
    const options = {
      hostname: 'api.neynar.com',
      path: '/v2/farcaster/signer',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': NEYNAR_API_KEY
      }
    };
    
    const data = JSON.stringify({
      fid: FID
    });
    
    const result = await makeRequest(options, data);
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.body, null, 2));
    
    if (result.body.signer_uuid) {
      console.log('');
      console.log('✅ Signer created!');
      console.log('Signer UUID:', result.body.signer_uuid);
      console.log('Status:', result.body.status);
      if (result.body.signer_approval_url) {
        console.log('Approval URL:', result.body.signer_approval_url);
      }
    }
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

createSigner();
