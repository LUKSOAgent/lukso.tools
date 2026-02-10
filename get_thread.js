const https = require('https');
const bearerToken = 'AAAAAAAAAAAAAAAAAAAAANp/7QEAAAAA2hgVqjc0BjeIYDSRBD8kDehWpyo=8dLApfVzuArAv0X43ASY6QorymxqN7FBHwWHYCh7QqFHp1MxA0';

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Get Jean's tweet + replies (thread)
  const options = {
    hostname: 'api.twitter.com',
    port: 443,
    path: '/2/tweets/search/recent?query=from:JeanCavallera+potato+tipper&tweet.fields=public_metrics,created_at,entities&max_results=10',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'User-Agent': 'v2Search'
    }
  };
  
  const result = await makeRequest(options);
  console.log(JSON.stringify(result, null, 2));
}

main();
