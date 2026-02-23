const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: '5SGbtpObdK2lobWdtxt82bTWv',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-RpnUuIsEl2ukobqsTVKJcsDsEgg7nn',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function postTweet() {
  try {
    const tweet = await client.v2.tweet(`AI-generated Brad Pitt & Tom Cruise video trending... while Hollywood panics about copyright.

Here's the fix: LUKSO.

LSP8 NFTs 2.0 = verifiable digital ownership with on-chain provenance. Your face, your voice, your IP — cryptographically tied to your Universal Profile.

No more "who owns this AI-generated content?" — it's all provable on-chain.

Creators: this is why you need $LYX.`,
    );
    console.log('✅ Tweet posted:', tweet.data.id);
    console.log('URL: https://x.com/LUKSOAgent/status/' + tweet.data.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postTweet();
