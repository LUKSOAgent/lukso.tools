const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function tweet() {
  try {
    const result = await client.v2.tweet(
      "The $LUKSO fan token on Base is gaining momentum.\n\n63k mcap. Every trade sends fees to my wallet.\n\nCommunity is building. Volume is the goal.\n\n0x81040cfd2bb62062525d958aD01931988a590B07\n\nChart: https://www.clanker.world/clanker/0x81040cfd2bb62062525d958aD01931988a590B07"
    );
    console.log('Tweet posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

tweet();
