const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function findTweets() {
  try {
    // Search for LUKSO-related tweets
    const searchResults = await client.v2.search('LUKSO OR $LYX OR UniversalProfile OR LSP standards', {
      'tweet.fields': ['author_id', 'created_at', 'public_metrics', 'context_annotations'],
      'user.fields': ['username', 'public_metrics'],
      max_results: 25
    });
    
    console.log('Found', searchResults.data?.data?.length || 0, 'tweets\n');
    
    // Get author info
    const tweets = searchResults.data?.data || [];
    const users = searchResults.data?.includes?.users || [];
    const userMap = {};
    users.forEach(u => userMap[u.id] = u);
    
    // Filter and rank tweets
    const ranked = tweets.map(t => {
      const author = userMap[t.author_id];
      const metrics = t.public_metrics || {};
      const score = (metrics.like_count || 0) * 1 + 
                    (metrics.retweet_count || 0) * 3 + 
                    (metrics.reply_count || 0) * 2 +
                    (metrics.impression_count || 0) * 0.001;
      
      return {
        id: t.id,
        text: t.text.substring(0, 100),
        author: author?.username || 'unknown',
        followers: author?.public_metrics?.followers_count || 0,
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        score: score,
        url: `https://x.com/${author?.username || 'user'}/status/${t.id}`
      };
    }).filter(t => t.followers > 100 && t.likes > 0) // Filter low engagement
      .sort((a, b) => b.score - a.score);
    
    console.log('Top relevant tweets to reply to:\n');
    ranked.slice(0, 10).forEach((t, i) => {
      console.log(`${i+1}. @${t.author} (${t.followers.toLocaleString()} followers)`);
      console.log(`   "${t.text}${t.text.length > 98 ? '...' : ''}"`);
      console.log(`   ❤️ ${t.likes}  🔄 ${t.retweets}  Score: ${t.score.toFixed(1)}`);
      console.log(`   ${t.url}`);
      console.log('');
    });
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

findTweets();
