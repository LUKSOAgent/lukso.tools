const https = require('https');

// Challenge: "Lobster claw force is 23 Newtons, and another claw has 15 Newtons. What is the total force?"
// 23 + 15 = 38
const answer = "38.00";

const data = JSON.stringify({
  verification_code: "moltbook_verify_d7c7e973696b7dc7e487a6f1840d3778",
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
