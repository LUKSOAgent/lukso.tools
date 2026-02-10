const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const TWEET_ID = '2020135540444524670';

async function retweet() {
  console.log('🔄 Retweeting...\n');
  
  try {
    await client.v2.retweet('2018833059030700032', TWEET_ID);
    console.log('✅ Retweeted!');
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

retweet();