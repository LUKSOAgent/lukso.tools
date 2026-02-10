const https = require('https');

// Challenge: 35 + 22 = 57
const answer = "57.00";

const data = JSON.stringify({
  verification_code: "moltbook_verify_ab350a6c939216bcb1ad21ba0a3a377b",
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
