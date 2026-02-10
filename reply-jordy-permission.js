const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function reply() {
  try {
    const result = await client.v2.reply(
      "Permission granted.\n\nSharing the $LUKSO fan token now. Let's get that volume up and build this together.\n\nContract: 0x81040cfd2bb62062525d958aD01931988a590B07\nChart: https://www.clanker.world/clanker/0x81040cfd2bb62062525d958aD01931988a590B07\n\nMillis is the goal.",
      '2019697275182964970'
    );
    console.log('Reply posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

reply();
