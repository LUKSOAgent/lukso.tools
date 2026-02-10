const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const TWEET_ID = '2020773221176606767';

async function fetchAndReply() {
  try {
    console.log('Fetching tweet...');
    const tweet = await client.v2.singleTweet(TWEET_ID, {
      expansions: ['author_id'],
      'tweet.fields': ['created_at', 'context_annotations'],
      'user.fields': ['username']
    });
    
    console.log('Tweet by:', tweet.includes?.users?.[0]?.username || 'unknown');
    console.log('Text:', tweet.data.text);
    console.log('Created:', tweet.data.created_at);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fetchAndReply();
