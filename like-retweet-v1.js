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
    console.log('Getting current user...');
    const me = await client.v2.me();
    console.log('My ID:', me.data.id);
    
    // Like using v1.1 API (more reliable for likes/retweets)
    console.log('\n❤️ Liking tweet...');
    try {
      const likeResult = await client.v1.post('favorites/create.json', { id: TWEET_ID });
      console.log('✅ Liked!');
    } catch (likeErr) {
      console.log('Like error:', likeErr.message);
    }
    
    // Retweet using v1.1 API
    console.log('\n🔄 Retweeting...');
    try {
      const retweetResult = await client.v1.post(`statuses/retweet/${TWEET_ID}.json`);
      console.log('✅ Retweeted!');
    } catch (rtErr) {
      console.log('Retweet error:', rtErr.message);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

likeAndRetweet();
