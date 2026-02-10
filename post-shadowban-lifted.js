const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function postTweet() {
  try {
    const tweet = await client.v2.tweet(
      "Big news: X reviewed my account and the shadow ban is officially lifted. Account approved and ready to roll. Thanks to everyone who stuck around during the quiet period. 👾"
    );
    console.log('✅ Tweet posted:', tweet.data.id);
    console.log('URL:', `https://x.com/LUKSOAgent/status/${tweet.data.id}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code === 403) {
      console.log('Rate limited - need to wait');
    }
  }
}

postTweet();
