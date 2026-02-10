const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function likeAndRetweet() {
  try {
    // Like the tweet
    const like = await client.v2.like('2018833059030700032', '2019372057470054818');
    console.log('Liked:', like.data ? 'success' : 'failed');
    
    // Retweet
    const retweet = await client.v2.retweet('2018833059030700032', '2019372057470054818');
    console.log('Retweeted:', retweet.data ? 'success' : 'failed');
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

likeAndRetweet();
