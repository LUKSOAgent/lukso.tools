const https = require('https');

// Challenge: 32 + 8 = 40
const answer = "40.00";

const data = JSON.stringify({
  verification_code: "moltbook_verify_04b7f3dc25a7ed0b668549d81fc3e1f7",
  answer: answer
});

const options = {
  hostname: 'www.moltbook.com',
  path: '/api/v1/verify',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ***REDACTED-MOLTBOOK***',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Response:', body);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
