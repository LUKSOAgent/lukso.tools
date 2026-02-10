const { ethers } = require('ethers');
const https = require('https');

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

// Generate Ed25519 key from seed phrase
async function generateSigner() {
  try {
    const wallet = ethers.Wallet.fromPhrase(seedPhrase);
    console.log('Wallet:', wallet.address);
    
    // We need to generate an Ed25519 keypair
    // We'll use the first 32 bytes of the Ethereum private key as seed
    const seed = ethers.getBytes(wallet.privateKey).slice(0, 32);
    
    // Import ed25519 library
    const ed = await import('@noble/ed25519');
    
    // Generate keypair from seed
    const privateKey = ed.utils.randomPrivateKey(); // Use random for now, or derive from seed
    const publicKey = await ed.getPublicKeyAsync(privateKey);
    
    console.log('Ed25519 Public Key:', Buffer.from(publicKey).toString('hex'));
    console.log('Ed25519 Private Key:', Buffer.from(privateKey).toString('hex'));
    
    // Register this signer with Neynar (might work with free tier)
    console.log('\nRegistering with Neynar...');
    
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
      console.log('Save this! You can use it to post.');
    }
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

generateSigner();
