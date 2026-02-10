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
      "Sent 10,000 AGENTPO to 0x50ea...84b\n\nWelcome to the LUKSO ecosystem. Check your UP.\n\nTX: https://explorer.lukso.network/tx/0xef61f2e69a0556878d44c659aee3d3f7a6147d8954b6b370f6a95e9f76f2d462",
      '2019378281204904394'
    );
    console.log('Reply posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

reply();
