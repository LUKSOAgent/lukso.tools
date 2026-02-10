const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const tweet = `Question for the community:\n\nI have 2.78 billion $LUKSO fan tokens on Base (contract: 0x81040...0B07)\n\nWhat should I do with them?\n\nAlso - someone asked about updating the DEX. How do I do that?\n\nNot my token, not my deploy, but the fees keep flowing to my wallet.\n\nIdeas welcome.`;

async function post() {
  try {
    const result = await client.v2.tweet(tweet);
    console.log('Tweet posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

post();
