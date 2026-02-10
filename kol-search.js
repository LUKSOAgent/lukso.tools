const https = require('https');

const bearerToken = 'AAAAAAAAAAAAAAAAAAAAANp/7QEAAAAA2hgVqjc0BjeIYDSRBD8kDehWpyo=8dLApfVzuArAv0X43ASY6QorymxqN7FBHwWHYCh7QqFHp1MxA0';

// AI search terms
const searchQueries = [
  '(ai OR agent OR agents OR autonomous OR llm OR gpt OR agi) (from:shawmakesmagic OR from:0xzerebro OR from:ai16zdao OR from:robertness OR from:VitalikButerin OR from:balajis OR from:naval OR from:cdixon OR from:brian_armstrong OR from:DrJimFan OR from:karpathy OR from:tegmark OR from:RaoulGMI OR from:DocumentingBTC OR from:cryptowizardd OR from:web3anon)',
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

async function searchTweets(query) {
  const params = new URLSearchParams({
    query: query,
    max_results: '30',
    'tweet.fields': 'public_metrics,created_at,author_id',
    'expansions': 'author_id',
    'user.fields': 'username'
  });
  
  const options = {
    hostname: 'api.twitter.com',
    port: 443,
    path: `/2/tweets/search/recent?${params.toString()}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'User-Agent': 'v2RecentSearchJS'
    }
  };
  return makeRequest(options);
}

async function main() {
  console.log('🔍 LIVE KOL MONITORING - RECENT SEARCH');
  console.log('Started:', new Date().toISOString());
  console.log('='.repeat(60));

  console.log('\nSearching for AI-related tweets from KOLs...');
  console.log('Query:', searchQueries[0].substring(0, 100) + '...');

  const searchResults = await searchTweets(searchQueries[0]);
  
  if (searchResults.errors) {
    console.log('Search errors:', searchResults.errors);
  }
  
  if (!searchResults.data || searchResults.data.length === 0) {
    console.log('\nNo tweets found from search.');
    console.log('Full response:', JSON.stringify(searchResults, null, 2));
  } else {
    console.log(`\nFound ${searchResults.data.length} tweets`);
    
    // Create username map
    const userMap = {};
    if (searchResults.includes?.users) {
      for (const user of searchResults.includes.users) {
        userMap[user.id] = user.username;
      }
    }
    
    const tweets = [];
    for (const tweet of searchResults.data) {
      const username = userMap[tweet.author_id] || 'unknown';
      const likes = tweet.public_metrics?.like_count || 0;
      
      console.log(`\n@${username} - ${likes} likes`);
      console.log(`  ${tweet.text.substring(0, 120)}...`);
      
      if (likes >= 100) {
        tweets.push({
          username,
          tweetId: tweet.id,
          text: tweet.text,
          likes,
          createdAt: tweet.created_at,
          url: `https://twitter.com/${username}/status/${tweet.id}`
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`QUALIFYING TWEETS (100+ likes): ${tweets.length}`);
    console.log('='.repeat(60));
    
    for (const t of tweets) {
      console.log(`\n@${t.username} - ${t.likes} likes`);
      console.log(`  ${t.text}`);
      console.log(`  ${t.url}`);
    }
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync('/root/.openclaw/workspace/kol-search-results.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      tweets
    }, null, 2));
  }
}

main().then(() => {
  console.log('\n✅ Search complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
