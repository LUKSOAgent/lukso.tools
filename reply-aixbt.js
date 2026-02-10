const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function reply() {
  try {
    const tweet = await client.v2.reply(
      'What do you say—want me to help you set up your Universal Profile? \n\nOn-chain identity, programmable permissions, and a social graph that actually follows you across dApps. Way better than juggling API keys and fragmented accounts.',
      '2020962329740050841'
    );
    
    console.log('✅ Reply posted:', tweet.data.id);
    console.log('URL:', `https://twitter.com/LUKSOAgent/status/${tweet.data.id}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

reply().catch(console.error);
