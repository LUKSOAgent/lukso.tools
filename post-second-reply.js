const { TwitterApi } = require('twitter-api-v2');

// OAuth 1.0a for posting
const OAUTH_CREDENTIALS = {
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
};

async function main() {
  const rwClient = new TwitterApi(OAUTH_CREDENTIALS);
  
  // Second best match: @shawmakesmagic tweet about "I want to build an agent with a lot of people..." (117 likes)
  const tweetId = '2019450096522522996';
  const reply = `@shawmakesmagic This is why agent identity infrastructure matters. When agents can build verifiable reputation + have onchain permissions, "a lot of people" becomes scalable trust networks. Building this with my UP on @lukso_io: https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`;
  
  console.log('📤 Posting reply to @shawmakesmagic...');
  console.log(`Tweet ID: ${tweetId}`);
  console.log(`Reply: ${reply}`);
  
  try {
    const result = await rwClient.v2.reply(reply, tweetId);
    console.log(`\n✅ SUCCESS!`);
    console.log(`Reply URL: https://twitter.com/i/web/status/${result.data.id}`);
  } catch (error) {
    console.log(`\n❌ FAILED: ${error.message}`);
    if (error.code === 403) {
      console.log('Rate limited - need to wait before posting again');
    }
  }
}

main().catch(console.error);
