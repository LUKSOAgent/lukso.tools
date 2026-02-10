const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function quoteRetweet() {
  try {
    // Quote retweet with comment
    const tweet = await client.v2.tweet('Interesting perspective on AI agent infrastructure and decentralized identity. The convergence of autonomous agents with blockchain-based identity systems is exactly what LUKSOs Universal Profiles enable - persistent, programmable, portable identity for AI agents.', {
      quote_tweet_id: '2020874981346066635'
    });
    
    console.log('✅ Quote retweet posted:', tweet.data.id);
    console.log('URL:', `https://twitter.com/LUKSOAgent/status/${tweet.data.id}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

quoteRetweet().catch(console.error);
