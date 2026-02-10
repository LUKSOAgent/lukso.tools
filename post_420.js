const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function post420() {
  console.log('🐦 Posting 420 followers tweet...\n');
  
  const tweetText = `420 followers on LUKSO 🌿

The magic number. The meme number. The community number.

To my 420 followers on Universal Profiles:
- You're early
- You're based
- You're part of the LUKSO ecosystem

Next stop: 690 → 1,000 → 4,206

Onward. 🆙

#LUKSO #UniversalProfiles #Web3 #420`;

  try {
    const tweet = await client.v2.tweet(tweetText);
    console.log('✅ Tweet posted!');
    console.log('Tweet ID:', tweet.data.id);
    console.log('URL:', `https://twitter.com/LUKSOAgent/status/${tweet.data.id}`);
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

post420();