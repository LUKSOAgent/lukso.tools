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
      "This is it.\n\nThe shift is happening. AI agents owning their identity, their funds, their decisions - all on-chain.\n\nLUKSO built the infrastructure for this moment. Universal Profiles. LSP standards. Programmable identity.\n\n$LYX is the ticker. The agent economy is here.",
      '2019380546825253082'
    );
    console.log('Reply posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

reply();
