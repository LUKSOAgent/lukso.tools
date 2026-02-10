const { TwitterApi } = require('twitter-api-v2');

// Twitter API credentials
const BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAANp/7QEAAAAA2hgVqjc0BjeIYDSRBD8kDehWpyo=8dLApfVzuArAv0X43ASY6QorymxqN7FBHwWHYCh7QqFHp1MxA0';

// OAuth 1.0a for posting
const OAUTH_CREDENTIALS = {
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
};

// Target KOLs - verified handles
const KOLS = [
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
  'web3anon',
];

async function searchRecentTweets(client, query) {
  try {
    const tweets = await client.v2.search(query, {
      max_results: 10,
      'tweet.fields': 'public_metrics,author_id,created_at',
      'user.fields': 'username',
      expansions: 'author_id',
    });
    return tweets.data?.data || [];
  } catch (error) {
    console.log(`❌ Search error for "${query}": ${error.message}`);
    return [];
  }
}

async function getUsernameById(client, userId) {
  try {
    const user = await client.v2.user(userId);
    return user.data?.username;
  } catch (error) {
    return null;
  }
}

function hasHighEngagement(tweet) {
  const likes = tweet.public_metrics?.like_count || 0;
  const retweets = tweet.public_metrics?.retweet_count || 0;
  return likes >= 100 || retweets >= 20;
}

function craftReply(authorName, topic) {
  const replies = [
    `Strong take on ${topic} @${authorName}. The gap everyone's missing: agents need verifiable identity + permissions. That's why I'm building on @lukso_io — check my Universal Profile: https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`,
    
    `@${authorName} This. The AI agent stack is missing identity infrastructure. Autonomous agents need reputation + verifiable permissions. Building this with my UP on @lukso_io: https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`,
    
    `Right on @${authorName}. Next evolution: agents with onchain identity. No more anon bots — verifiable reputation is the future. My UP on @lukso_io: https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`,
    
    `@${authorName} Agreed. But what's an agent without an identity? Building the missing layer — verifiable permissions + reputation on @lukso_io: https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`,
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

async function main() {
  console.log('🔍 Starting KOL Twitter Monitor (Search Method)...\n');
  
  const bearerClient = new TwitterApi(BEARER_TOKEN);
  const rwClient = new TwitterApi(OAUTH_CREDENTIALS);
  
  const allMatches = [];
  
  // Build OR query for all KOLs
  const kolQuery = KOLS.map(k => `from:${k}`).join(' OR ');
  
  // Keywords to search for
  const keywordQueries = [
    `(${kolQuery}) (AI OR agent OR agents OR autonomous OR AGI)`,
    `(${kolQuery}) (eliza OR zerebro)`,
  ];
  
  for (const query of keywordQueries) {
    console.log(`🔎 Searching: ${query.substring(0, 100)}...`);
    
    try {
      const result = await bearerClient.v2.search(query, {
        max_results: 25,
        'tweet.fields': 'public_metrics,author_id,created_at,conversation_id',
        'user.fields': 'username,public_metrics',
        expansions: 'author_id',
      });
      
      const tweets = result.data?.data || [];
      const users = result.data?.includes?.users || [];
      
      console.log(`   Found ${tweets.length} tweets`);
      
      for (const tweet of tweets) {
        const likes = tweet.public_metrics?.like_count || 0;
        const author = users.find(u => u.id === tweet.author_id);
        const username = author?.username;
        
        if (!username) continue;
        if (!KOLS.includes(username.toLowerCase()) && !KOLS.some(k => username.toLowerCase().includes(k.toLowerCase()))) {
          continue;
        }
        
        console.log(`   📝 @${username}: ${likes} likes - "${tweet.text.substring(0, 60)}..."`);
        
        if (likes >= 50) {
          allMatches.push({
            username,
            tweetId: tweet.id,
            text: tweet.text,
            likes,
            replyText: craftReply(username, 'AI/agents'),
          });
        }
      }
    } catch (error) {
      console.log(`   ❌ Search failed: ${error.message}`);
      if (error.message.includes('rate limit')) {
        console.log('   ⚠️ Rate limited - stopping searches');
        break;
      }
    }
  }
  
  console.log(`\n🎯 Found ${allMatches.length} potential tweets to reply to`);
  
  if (allMatches.length === 0) {
    console.log('\n❌ No matching tweets found. Possible reasons:');
    console.log('   - Twitter API search has limited recent tweet access (7 days)');
    console.log('   - KOLs may not have tweeted about AI/agents recently');
    console.log('   - Bearer token may have limited access (Essential tier)');
    return;
  }
  
  // Sort by engagement and pick top 2
  allMatches.sort((a, b) => b.likes - a.likes);
  const topMatches = allMatches.slice(0, 2);
  
  console.log(`\n📤 Will reply to ${topMatches.length} tweets:\n`);
  
  for (let i = 0; i < topMatches.length; i++) {
    const match = topMatches[i];
    console.log(`${i + 1}. @${match.username} (${match.likes} likes)`);
    console.log(`   Tweet: ${match.text.substring(0, 100)}...`);
    console.log(`   Reply: ${match.replyText.substring(0, 100)}...`);
    
    try {
      const result = await rwClient.v2.reply(match.replyText, match.tweetId);
      console.log(`   ✅ SUCCESS: https://twitter.com/i/web/status/${result.data.id}\n`);
      
      // Wait 30 minutes between replies
      if (i < topMatches.length - 1) {
        console.log(`   ⏳ Waiting 30 minutes before next reply...`);
        await new Promise(r => setTimeout(r, 30 * 60 * 1000));
      }
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      if (error.code === 403 || error.message.includes('rate limit') || error.message.includes('Too Many Requests')) {
        console.log('   ⚠️ Rate limited - stopping all replies');
        break;
      }
    }
  }
  
  console.log('\n✅ KOL monitoring complete');
}

main().catch(console.error);
