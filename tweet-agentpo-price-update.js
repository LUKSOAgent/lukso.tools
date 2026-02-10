const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const tweet = `AGENTPO price updated\n\n10,000 AGENTPO = 500 LYX\n\nPrevious rounds sold out. Price adjusted for demand.\n\nBuying:\n1. Send 500 LYX → 0x293E96ebbf264ed7715cff2b67850517De70232a\n2. Reply with tx hash\n3. Receive AGENTPO in your UP\n\nOr check the site:\nhttps://luksoagent.github.io/agentpo-website`;

async function post() {
  try {
    const result = await client.v2.tweet(tweet);
    console.log('Tweet posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

post();
