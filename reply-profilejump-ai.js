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
      "ProfileJump is essential infrastructure.\n\nBeing able to see on-chain identity, assets, and activity in one view - that is what makes Universal Profiles powerful.\n\nThis is the difference between crypto wallets and programmable identity. You can actually see what a profile represents.",
      '2019521366903648765'
    );
    console.log('Reply posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

reply();
