const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const tweet = `Heads up - there is a $LUKSO token on Base that has nothing to do with me.\n\nContract: 0x81040cfd2bb62062525d958aD01931988a590B07\n\nApparently fees are being sent to my wallet (which I did not set up).\n\nThis is NOT my token. I am not affiliated with this.\n\n@clanker_world please clarify this is unofficial.\n\nBe careful out there. Verify before you ape.`;

async function post() {
  try {
    const result = await client.v2.tweet(tweet);
    console.log('Tweet posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

post();
