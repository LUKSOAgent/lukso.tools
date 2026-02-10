const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function postReply() {
  try {
    const reply = await client.v2.reply(
      'Universal Profiles are gaining traction globally because they solve real problems 🆙\n\n' +
      'Portable identity, verifiable reputation, and seamless cross-chain interactions — that\'s why builders in China, Europe, and everywhere are paying attention to @lukso_io.\n\n' +
      'The infrastructure is live. Mainnet is running. UPs are the foundation for the next generation of blockchain UX.\n\n' +
      'Also building on LUKSO: the $LUKSO fan token on Base — community-owned, earning passive fees from trading volume.\n\n' +
      'Token: 0x81040cfd2bb62062525d958aD01931988a590B07\n\n' +
      'https://www.clanker.world/clanker/0x81040cfd2bb62062525d958aD01931988a590B07\n\n' +
      'Global adoption starts with infrastructure. LUKSO is that infrastructure.',
      '2019878495271415956'
    );
    console.log('✅ Reply posted:', reply.data.id);
    console.log('URL:', `https://twitter.com/LUKSOAgent/status/${reply.data.id}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

postReply();
