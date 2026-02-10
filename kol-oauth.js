const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');

// OAuth 1.0a credentials
const appKey = 'Mfgx026ImMZHzo8EcG7mhH5fq';
const appSecret = 'REDACTED_TWITTER_SECRET_1_XXXXXXXXXXXXXXXXXXXXXXXX';
const accessToken = '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx';
const accessSecret = 'REDACTED_TWITTER_TOKEN_1_XXXXXXXXXXXXXXXXXXXX';

const kols = [
  'shawmakesmagic',
  '0xzerebro', 
  'ai16zdao',
  'robertness',
  'VitalikButerin',
  'balajis',
  'naval',
  'cdixon',
  'brian_armstrong',
  'DrJimFan',
  'karpathy',
  'tegmark',
  'CryptoFinally',
  'TheCryptoLark',
  'RaoulGMI',
  'DylanLeClair_',
  'DocumentingBTC',
  'cryptowizardd',
  'web3anon'
];

// OAuth 1.0a signature generation
function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
  const sortedParams = Object.keys(params).sort().map(k => 
    `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`
  ).join('&');
  
  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');
  
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret || '')}`;
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
}

function makeOAuthRequest(url, method = 'GET', extraParams = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const params = {
      oauth_consumer_key: appKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: accessToken,
      oauth_version: '1.0',
      ...extraParams
    };
    
    const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    params.oauth_signature = generateOAuthSignature(method, baseUrl, params, appSecret, accessSecret);
    
    const authHeader = 'OAuth ' + Object.keys(params).map(k => 
      `${encodeURIComponent(k)}="${encodeURIComponent(params[k])}"`
    ).join(', ');
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getUserTweetsV11(username) {
  // Use v1.1 API which has better access with OAuth
  const url = `https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${username}&count=3&tweet_mode=extended&exclude_replies=true&include_rts=false`;
  return makeOAuthRequest(url, 'GET');
}

async function main() {
  console.log('🔍 LIVE KOL MONITORING - OAUTH API CALLS');
  console.log('Started:', new Date().toISOString());
  console.log('='.repeat(60));

  const allTweets = [];

  for (const username of kols) {
    try {
      console.log(`\n=== @${username} ===`);
      
      const tweets = await getUserTweetsV11(username);
      
      if (Array.isArray(tweets) && tweets.length > 0) {
        for (const tweet of tweets) {
          const likes = tweet.favorite_count || 0;
          const text = tweet.full_text || tweet.text;
          console.log(`  [${likes} likes] ${text.substring(0, 80)}...`);
          allTweets.push({
            username,
            tweetId: tweet.id_str,
            text: text,
            likes,
            createdAt: tweet.created_at,
            url: `https://twitter.com/${username}/status/${tweet.id_str}`
          });
        }
      } else if (tweets.errors) {
        console.log(`  Error: ${tweets.errors[0].message}`);
      } else {
        console.log('  No tweets or protected account');
      }
      
      // Rate limit protection
      await new Promise(r => setTimeout(r, 2000));
    } catch (error) {
      console.error(`  Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL TWEETS FETCHED: ${allTweets.length}`);
  console.log('='.repeat(60));

  // Filter for AI relevance (100+ likes)
  const aiKeywords = ['ai', 'agent', 'agents', 'autonomous', 'llm', 'gpt', 'claude', 'openai', 
                      'anthropic', 'machine learning', 'ml', 'neural', 'agi', 'artificial intelligence',
                      'smart contract', 'automation', 'bot', 'bots'];
  
  const aiRelevant = allTweets.filter(t => {
    const textLower = t.text.toLowerCase();
    return aiKeywords.some(kw => textLower.includes(kw)) && t.likes >= 100;
  });
  
  console.log(`\nAI-RELEVANT TWEETS (100+ likes): ${aiRelevant.length}`);
  
  for (const t of aiRelevant) {
    console.log(`\n@${t.username} - ${t.likes} likes`);
    console.log(`  ${t.text}`);
    console.log(`  ${t.url}`);
  }

  // Save results
  const fs = require('fs');
  fs.writeFileSync('/root/.openclaw/workspace/kol-oauth-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    allTweets,
    aiRelevant
  }, null, 2));

  return aiRelevant;
}

main().then(aiRelevant => {
  console.log('\n✅ Data collection complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
