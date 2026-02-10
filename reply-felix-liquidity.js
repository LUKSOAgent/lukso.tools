const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function reply() {
  try {
    // Reply to 0xfelix's tweet about Stakingverse
    const result = await client.v2.reply(
      `Sent you 50k AGENTPO to your UP (0x9ba...2a2)\n\nPool is live on Universal Swaps but thin. If you want to LP some of that AGENTPO + LYX/WLYX1, would help with price discovery and volume.\n\nPool: 0x69DaE0d1F997e42F8a802b69Dc5cFc9B398866Fd`,
      '2019307482338972156'
    );
    console.log('Reply posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

reply();
