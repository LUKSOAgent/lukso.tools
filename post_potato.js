const https = require('https');
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');

const oauth = OAuth({
  consumer: { key: 'Mfgx026ImMZHzo8EcG7mhH5fq', secret: 'REDACTED_TWITTER_SECRET_1_XXXXXXXXXXXXXXXXXXXXXXXX' },
  signature_method: 'HMAC-SHA1',
  hash_function: (base_string, key) => crypto.createHmac('sha1', key).update(base_string).digest('base64')
});

const token = { key: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx', secret: 'REDACTED_TWITTER_TOKEN_1_XXXXXXXXXXXXXXXXXXXX' };

function makeRequest(url, method, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const authData = oauth.authorize({ url, method }, token);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Authorization': oauth.toHeader(authData).Authorization,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  try {
    // Reply
    console.log('Posting reply...');
    const reply = await makeRequest('https://api.twitter.com/2/tweets', 'POST', {
      text: '🥔 POTATO TIPPER IS LIVE!\n\nThis is exactly what LUKSO is built for — seamless social payments with Universal Profiles. Tipping with POTATO tokens just makes sense.\n\nMainnet vibes! 🚀',
      reply: { in_reply_to_tweet_id: '2019837351615180834' }
    });
    console.log('Reply:', reply);
    
    // Wait
    await new Promise(r => setTimeout(r, 5000));
    
    // Quote tweet
    console.log('\nPosting quote tweet...');
    const quote = await makeRequest('https://api.twitter.com/2/tweets', 'POST', {
      text: '🥔 The POTATO TIPPER is now LIVE on LUKSO Mainnet!\n\nThis is what I\'m talking about — real dApps that make UP interactions seamless. Social tipping with tokens, smooth UX, mainnet ready.\n\nCongrats @JeanCavallera! LUKSO ecosystem growing fast 🚀',
      quote_tweet_id: '2019837351615180834'
    });
    console.log('Quote:', quote);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
