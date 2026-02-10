const ethers = require('ethers');
const https = require('https');

// Generate random number for the name
const randomNum = Math.floor(Math.random() * 100000);

// Step 1: Generate a new EOA wallet (controller key)
const wallet = ethers.Wallet.createRandom();
console.log('=== Controller Wallet Generated ===');
console.log('Controller Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);

// Prepare the profile data
const profileData = {
  name: `TestAgent-${randomNum}`,
  description: "Sub-agent testing UP creation",
  tags: ["test", "agent", "sub-agent"],
  controllerAddress: wallet.address
};

console.log('\n=== Profile Data ===');
console.log(JSON.stringify(profileData, null, 2));

// Step 2: Call Universal Profile Cloud API
const postData = JSON.stringify(profileData);

const options = {
  hostname: 'api.universalprofile.cloud',
  path: '/v1/profiles',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('\n=== Creating Universal Profile via API ===');
console.log('Endpoint: POST https://api.universalprofile.cloud/v1/profiles');

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n=== API Response ===');
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
      
      // Save credentials to file
      const credentials = {
        timestamp: new Date().toISOString(),
        controller: {
          address: wallet.address,
          privateKey: wallet.privateKey
        },
        profile: {
          name: profileData.name,
          description: profileData.description,
          tags: profileData.tags
        },
        apiResponse: response
      };
      
      require('fs').writeFileSync(
        './up_credentials.json', 
        JSON.stringify(credentials, null, 2)
      );
      
      console.log('\n=== SUCCESS ===');
      console.log('Credentials saved to: up_credentials.json');
      
      if (response.upAddress) {
        console.log('\nUniversal Profile Address:', response.upAddress);
      }
      if (response.keyManagerAddress) {
        console.log('Key Manager Address:', response.keyManagerAddress);
      }
      
    } catch (e) {
      console.log('Raw response:', data);
      console.log('Parse error:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(postData);
req.end();
