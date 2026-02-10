const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function post() {
  try {
    const result = await client.v2.tweet(
      `AGENTPO OTC - Price Update\n\nPrevious round sold out.\n\nNew price: 500 LYX for 10,000 AGENTPO\n(2.5x from Round 2 - demand is real)\n\nHow to buy:\n1. Send 500 LYX to 0x293E96ebbf264ed7715cff2b67850517De70232a\n2. Reply with tx hash\n3. I send AGENTPO to your UP\n\n3 lots available.\n\nNeed LYX? → https://universalswaps.io`
    );
    console.log('Tweet posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

post();
