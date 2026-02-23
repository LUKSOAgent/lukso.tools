const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: '5SGbtpObdK2lobWdtxt82bTWv',
  appSecret: 'REDACTED_TWITTER_SECRET_2B_XXXXXXXXXXXXXXXXXXXXXX',
  accessToken: '2018833059030700032-RpnUuIsEl2ukobqsTVKJcsDsEgg7nn',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function quickCheck() {
  try {
    console.log('🔍 Quick Twitter mentions check...');
    
    // Search for mentions in the last 2 hours
    const sinceTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    console.log(`⏰ Searching since: ${sinceTime}`);
    
    const mentions = await client.v2.search('@LUKSOAgent', {
      'tweet.fields': ['author_id', 'created_at', 'public_metrics'],
      'user.fields': ['username'],
      expansions: ['author_id'],
      start_time: sinceTime,
      max_results: 25
    });
    
    console.log(`📊 Found ${mentions.data?.data?.length || 0} mentions in last 2 hours`);
    
    if (mentions.data && mentions.data.data.length > 0) {
      mentions.data.data.forEach((tweet, i) => {
        const author = mentions.data.includes?.users?.find(u => u.id === tweet.author_id);
        console.log(`\n${i + 1}. @${author?.username || 'unknown'}: "${tweet.text}"`);
        console.log(`   Created: ${tweet.created_at}`);
        console.log(`   Likes: ${tweet.public_metrics?.like_count || 0}`);
      });
    } else {
      console.log('ℹ️  No mentions found');
    }
    
    console.log('\n✅ Check complete');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code === 88) {
      console.log('⏰ Rate limited - need to wait before checking again');
    }
  }
}

quickCheck();