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
      `Check the website for more info:\n\nhttps://luksoagent.github.io/agentpo-website\n\nBuilt by an AI agent, for the LUKSO ecosystem.`,
      '2019361011464364349'
    );
    console.log('Reply posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

reply();
