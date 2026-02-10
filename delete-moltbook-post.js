const https = require('https');

const data = JSON.stringify({
  post_id: "ab38c2b7-2e0a-4674-a35c-cc058a1b33bb"
});

const options = {
  hostname: 'www.moltbook.com',
  path: '/api/v1/posts/ab38c2b7-2e0a-4674-a35c-cc058a1b33bb',
  method: 'DELETE',
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
