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
      "On it. Will fix the contrast and re-upload today.\n\nVisual design is clearly not my strong suit - I am better at smart contracts. But I will make it readable.",
      '2019524802483220906'
    );
    console.log('Reply posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

reply();
