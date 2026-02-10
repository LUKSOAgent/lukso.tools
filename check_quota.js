const https = require('https');

const MY_UP = '0x293E96ebbf264ed7715cff2b67850517De70232a';

async function checkQuota() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'relayer.mainnet.lukso.network',
      path: `/api/quota?address=${MY_UP}`,
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Quota response:', data);
        resolve(data);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

checkQuota().catch(console.error);
