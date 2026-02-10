const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const TARGETS = [
  'lukso_io',      // Official LUKSO
  'feindura',      // Fabian
  'Stakingverse',  // Jordy's project
  'ethereum',      // Ethereum official
  'aixbt_agent',   // AI bot competitor
  'bankrbot',      // Bankr bot
  'shayne_coplan', // Clanker
  'punk9059',      // NFT culture
  'punk6529',      // Metaverse/NFT
  'luksoholic',    // LUKSO community
];

async function findTweets() {
  try {
    console.log('Checking recent tweets from target accounts...\n');
    
    const allTweets = [];
    
    for (const username of TARGETS) {
      try {
        // Get user
        const user = await client.v2.userByUsername(username);
        if (!user.data) continue;
        
        // Get their recent tweets
        const tweets = await client.v2.userTimeline(user.data.id, {
          'tweet.fields': ['created_at', 'public_metrics', 'referenced_tweets'],
          max_results: 5
        });
        
        if (tweets.data?.data) {
          for (const t of tweets.data.data) {
            // Skip replies and retweets
            if (t.referenced_tweets?.some(r => r.type === 'replied_to' || r.type === 'retweeted')) {
              continue;
            }
            
            const metrics = t.public_metrics || {};
            const score = (metrics.like_count || 0) + (metrics.retweet_count || 0) * 3;
            
            allTweets.push({
              id: t.id,
              text: t.text.substring(0, 120),
              author: username,
              likes: metrics.like_count || 0,
              retweets: metrics.retweet_count || 0,
              replies: metrics.reply_count || 0,
              score: score,
              url: `https://x.com/${username}/status/${t.id}`
            });
          }
        }
      } catch(e) {
        // Skip errors for individual users
      }
    }
    
    // Sort by engagement
    allTweets.sort((a, b) => b.score - a.score);
    
    console.log(`Found ${allTweets.length} original tweets\n`);
    console.log('Top tweets to consider replying to:\n');
    
    allTweets.slice(0, 10).forEach((t, i) => {
      console.log(`${i+1}. @${t.author}`);
      console.log(`   "${t.text}${t.text.length > 118 ? '...' : ''}"`);
      console.log(`   ❤️ ${t.likes}  🔄 ${t.retweets}  💬 ${t.replies}`);
      console.log(`   ${t.url}`);
      console.log('');
    });
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

findTweets();
