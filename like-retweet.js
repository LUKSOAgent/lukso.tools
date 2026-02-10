const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const TWEET_ID = '2020581055737290867';

async function likeAndRetweet() {
  try {
    console.log('🔍 Checking tweet:', TWEET_ID);
    
    // Get tweet info first
    const tweet = await client.v2.singleTweet(TWEET_ID);
    console.log('Tweet by:', tweet.data.author_id);
    console.log('Text:', tweet.data.text?.substring(0, 100));
    
    // Like the tweet
    console.log('\n❤️ Liking...');
    await client.v2.like(TWEET_ID);
    console.log('✅ Liked!');
    
    // Retweet
    console.log('\n🔄 Retweeting...');
    await client.v2.retweet(TWEET_ID);
    console.log('✅ Retweeted!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code === 403) {
      console.log('Rate limited or insufficient permissions');
    }
    if (err.code === 404) {
      console.log('Tweet not found or not accessible');
    }
  }
}

likeAndRetweet();
