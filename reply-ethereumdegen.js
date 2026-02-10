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
      "The infrastructure for autonomous agents is being built as we speak.\n\nOn LUKSO, we already have:\n- Universal Profiles for on-chain identity\n- LSP6 Key Manager for permission control\n- LSP25 for gasless transactions\n\nAI agents owning their own wallets and reputation. The future is closer than most think.\n\n$LYX",
      '2019658492861378696'
    );
    console.log('Reply posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

reply();
