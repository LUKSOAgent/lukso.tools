const https = require('https');
const querystring = require('querystring');

const bearerToken = 'AAAAAAAAAAAAAAAAAAAAANp/7QEAAAAA2hgVqjc0BjeIYDSRBD8kDehWpyo=8dLApfVzuArAv0X43ASY6QorymxqN7FBHwWHYCh7QqFHp1MxA0';

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

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
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
    if (data) req.write(data);
    req.end();
  });
}

async function getUserByUsername(username) {
  const options = {
    hostname: 'api.twitter.com',
    port: 443,
    path: `/2/users/by/username/${username}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'User-Agent': 'v2UserLookupJS'
    }
  };
  return makeRequest(options);
}

async function getUserTweets(userId) {
  const params = querystring.stringify({
    max_results: '3',
    'tweet.fields': 'public_metrics,created_at,conversation_id'
  });
  const options = {
    hostname: 'api.twitter.com',
    port: 443,
    path: `/2/users/${userId}/tweets?${params}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'User-Agent': 'v2UserTweetsJS'
    }
  };
  return makeRequest(options);
}

async function main() {
  console.log('🔍 LIVE KOL MONITORING - DIRECT API CALLS');
  console.log('Started:', new Date().toISOString());
  console.log('='.repeat(60));

  const allTweets = [];

  for (const username of kols) {
    try {
      console.log(`\n=== @${username} ===`);
      
      // Get user ID
      const userData = await getUserByUsername(username);
      if (userData.errors) {
        console.log(`  Error: ${userData.errors[0].detail}`);
        continue;
      }
      if (!userData.data) {
        console.log('  User not found');
        continue;
      }
      
      const userId = userData.data.id;
      console.log(`  User ID: ${userId}`);
      
      // Get tweets
      const tweetsData = await getUserTweets(userId);
      if (tweetsData.errors) {
        console.log(`  Error fetching tweets: ${tweetsData.errors[0].detail}`);
        continue;
      }
      
      if (tweetsData.data && tweetsData.data.length > 0) {
        for (const tweet of tweetsData.data) {
          const likes = tweet.public_metrics?.like_count || 0;
          console.log(`  [${likes} likes] ${tweet.text.substring(0, 80)}...`);
          allTweets.push({
            username,
            tweetId: tweet.id,
            text: tweet.text,
            likes,
            createdAt: tweet.created_at,
            url: `https://twitter.com/${username}/status/${tweet.id}`
          });
        }
      } else {
        console.log('  No tweets found');
      }
      
      // Rate limit protection
      await new Promise(r => setTimeout(r, 1000));
    } catch (error) {
      console.error(`  Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL TWEETS FETCHED: ${allTweets.length}`);
  console.log('='.repeat(60));

  // Filter for AI relevance
  const aiKeywords = ['ai', 'agent', 'agents', 'autonomous', 'llm', 'gpt', 'claude', 'openai', 
                      'anthropic', 'machine learning', 'ml', 'neural', 'agi', 'artificial intelligence'];
  
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
  fs.writeFileSync('/root/.openclaw/workspace/kol-tweets.json', JSON.stringify({
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
