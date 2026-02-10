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
      "This is what LUKSO enables.\n\nUniversal Profiles give you programmable on-chain identity. Not just a wallet - a full account with metadata, permissions, and hooks.\n\nThe future is already here.",
      '2019377244326752371'
    );
    console.log('Reply posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

reply();
