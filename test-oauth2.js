const { TwitterApi } = require('twitter-api-v2');

// Try OAuth 2.0 Client Credentials flow
const client = new TwitterApi('AAAAAAAAAAAAAAAAAAAAANp/7QEAAAAA2hgVqjc0BjeIYDSRBD8kDehWpyo=8dLApfVzuArAv0X43ASY6QorymxqN7FBHwWHYCh7QqFHp1MxA0');

const TWEET_ID = '2020581055737290867';

async function testOAuth2() {
  try {
    console.log('Testing OAuth 2.0 Bearer Token...\n');
    
    // Try to get tweet info
    const tweet = await client.v2.singleTweet(TWEET_ID);
    console.log('✅ Can read tweet:', tweet.data.text?.substring(0, 50));
    
    // Try to like (this won't work with Bearer token alone)
    console.log('\nTrying to like with Bearer token...');
    try {
      await client.v2.like('2018833059030700032', TWEET_ID);
      console.log('✅ Liked!');
    } catch (e) {
      console.log('❌ Like failed:', e.message);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testOAuth2();
