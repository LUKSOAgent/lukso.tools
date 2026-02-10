const https = require('https');

// The challenge: "Loobster's claw exerts twenty five newtons and its swim-merets add ten newtons, how much total force?"
// 25 + 10 = 35
const answer = "35.00";

const data = JSON.stringify({
  verification_code: "moltbook_verify_7bb488b7765eea11a6b4fdfd33022804",
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
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Response:', body);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(data);
req.end();
