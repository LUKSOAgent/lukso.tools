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
  const options = {
    hostname: 'api.twitter.com',
    port: 443,
    path: '/2/tweets/2019837351615180834?tweet.fields=public_metrics,author_id',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'User-Agent': 'v2Lookup'
    }
  };
  
  const result = await makeRequest(options);
  console.log(JSON.stringify(result, null, 2));
}

main();
