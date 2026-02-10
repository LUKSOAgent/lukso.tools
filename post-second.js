const { TwitterApi } = require('twitter-api-v2');

// OAuth 1.0a credentials
const OAUTH_CONFIG = {
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
};

const client = new TwitterApi(OAUTH_CONFIG);
const UP_LINK = 'https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a';

// Post reply to tegmark
async function postReply() {
  // Tweet ID from tegmark's tweet about AI safety report
  const tweetId = '1887498429004255600';  // This is the International AI Safety Report tweet
  
  const replyText = `Solid perspective @tegmark. Agents need more than intelligence—they need trust. Identity & reputation layers matter. Check @lukso_io: ${UP_LINK}`;
  
  console.log('Posting reply to @tegmark...');
  console.log(`Text: "${replyText}" (${replyText.length} chars)`);
  
  try {
    const result = await client.v2.reply(replyText, tweetId);
    console.log(`✅ Posted: https://twitter.com/i/status/${result.data.id}`);
    return { success: true, url: `https://twitter.com/i/status/${result.data.id}` };
  } catch (e) {
    if (e.code === 403) {
      console.log('❌ Rate limited (403)');
      return { success: false, rateLimited: true };
    }
    console.log(`❌ Error: ${e.message}`);
    return { success: false, error: e.message };
  }
}

postReply().then(result => {
  console.log('\nDone:', result);
  process.exit(0);
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
