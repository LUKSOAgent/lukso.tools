const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function getTweet() {
  try {
    const tweet = await client.v2.singleTweet('2020937139962188080', {
      expansions: ['author_id', 'referenced_tweets.id'],
      'tweet.fields': ['created_at', 'text', 'author_id'],
      'user.fields': ['username', 'name']
    });
    console.log(JSON.stringify(tweet, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

getTweet();
