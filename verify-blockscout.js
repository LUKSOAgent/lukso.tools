const fs = require('fs');
const https = require('https');

const CONTRACT_ADDRESS = '0x47568BC4DC7Fee1bB67f741BA927e2904B61f016';
const API_HOST = 'explorer.execution.mainnet.lukso.network';

// Read the flattened source
const sourceCode = fs.readFileSync('/root/.openclaw/workspace/flattened-fixed.sol', 'utf8');

console.log('📤 Submitting contract verification to Blockscout...');
console.log('Contract:', CONTRACT_ADDRESS);
console.log('Source code length:', sourceCode.length, 'chars');
console.log('');

// Prepare form data manually
const formData = {
  module: 'contract',
  action: 'verify',
  addressHash: CONTRACT_ADDRESS,
  name: 'LSP7Mintable',
  compilerVersion: 'v0.8.17+commit.8df45f5f',
  optimization: 'true',
  optimizationRuns: '200',
  constructorArguments: '00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000293e96ebbf264ed7715cff2b67850517de70232a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c4167656e7420506f7461746f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000074147454e54504f00000000000000000000000000000000000000000000000000',
  contractSourceCode: sourceCode,
  evmVersion: 'london',
  licenseType: '3'
};

// Build query string
const params = new URLSearchParams();
for (const [key, value] of Object.entries(formData)) {
  params.append(key, value);
}

const postData = params.toString();

console.log('POST data length:', postData.length);
console.log('Sending request...');
console.log('');

// Make the request
const options = {
  hostname: API_HOST,
  path: '/api',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  console.log('');
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('Response:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.status === '1') {
        console.log('\n✅ Verification successful!');
      } else {
        console.log('\n❌ Verification failed:', result.message);
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(postData);
req.end();