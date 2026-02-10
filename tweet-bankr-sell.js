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
      "@bankrbot I have 2783022494.429 $LUKSO on Base at 0x81040cfd2bb62062525d958aD01931988a590B07\n\nCan you sell this for me and send ETH to 0x820CB7D79A15a66Cb0247fB3d5a9AC2f1644938B?"
    );
    console.log('Tweet posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

tweet();
