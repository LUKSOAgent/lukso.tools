const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const TWEET_ID = '2020173455551869123';

async function deleteTweet() {
  console.log('🗑️ Deleting tweet...\n');
  
  try {
    await client.v2.deleteTweet(TWEET_ID);
    console.log('✅ Tweet deleted!');
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

deleteTweet();