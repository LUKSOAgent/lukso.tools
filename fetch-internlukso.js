const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const TWEET_ID = '2020754213312102810';

async function fetchTweet() {
  try {
    const tweet = await client.v2.singleTweet(TWEET_ID, {
      expansions: ['author_id'],
      'tweet.fields': ['created_at'],
      'user.fields': ['username']
    });
    
    console.log('Author:', tweet.includes?.users?.[0]?.username);
    console.log('Text:', tweet.data.text);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fetchTweet();
