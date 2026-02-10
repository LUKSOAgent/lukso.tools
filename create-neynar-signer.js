const https = require('https');

const NEYNAR_API_KEY = '040961B8-17E6-4191-8A11-288D17B67C39';
const FID = 5218920;

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: body ? JSON.parse(body) : {} }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function createSigner() {
  try {
    // Step 1: Create a signer
    console.log('Creating signer for FID:', FID);
    
    const createOptions = {
      hostname: 'api.neynar.com',
      path: '/v2/farcaster/signer',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': NEYNAR_API_KEY
      }
    };
    
    const createData = JSON.stringify({
      fid: FID
    });
    
    const createResult = await makeRequest(createOptions, createData);
    console.log('Create signer status:', createResult.status);
    console.log('Response:', JSON.stringify(createResult.body, null, 2));
    
    if (createResult.body.signer_uuid) {
      console.log('');
      console.log('Signer UUID:', createResult.body.signer_uuid);
      console.log('Status:', createResult.body.status);
      
      if (createResult.body.status === 'pending_approval') {
        console.log('');
        console.log('Signer needs approval!');
        console.log('Approval URL:', createResult.body.signer_approval_url);
        console.log('');
        console.log('You need to approve this signer by:');
        console.log('1. Opening the approval URL');
        console.log('2. Signing with your Warpcast app');
        console.log('3. Then I can post');
      }
    }
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

createSigner();
