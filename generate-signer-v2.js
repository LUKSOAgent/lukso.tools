const { ethers } = require('ethers');
const https = require('https');
const ed = require('@noble/ed25519');

const seedPhrase = 'warrior warfare describe cube grab doctor absurd extra burger alert credit slow';
const FID = 5218920;
const NEYNAR_API_KEY = '040961B8-17E6-4191-8A11-288D17B67C39';

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

async function generateSigner() {
  try {
    const wallet = ethers.Wallet.fromPhrase(seedPhrase);
    console.log('Wallet:', wallet.address);
    
    // Generate Ed25519 keypair
    const privateKey = ed.utils.randomPrivateKey();
    const publicKey = await ed.getPublicKey(privateKey);
    
    console.log('Ed25519 Public Key:', Buffer.from(publicKey).toString('hex'));
    
    // Try to register with Neynar
    console.log('\nTrying to register with Neynar...');
    
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
      fid: FID,
      public_key: '0x' + Buffer.from(publicKey).toString('hex')
    });
    
    const result = await makeRequest(options, data);
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.body, null, 2));
    
    if (result.body.signer_uuid) {
      console.log('\n✅ Signer UUID:', result.body.signer_uuid);
      console.log('Status:', result.body.status);
    }
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

generateSigner();
