const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const tweet = `POTATO is the culture coin of LUKSO.\n\nCreated by @JeanCavallera who has been building here before most people knew what a Universal Profile was.\n\nThis is not just a meme - it is proof that LUKSO's infrastructure works for creators.\n\nLSP7 standard. On-chain metadata. Real utility in the ecosystem.\n\n$LYX makes this possible.`;

async function post() {
  try {
    const result = await client.v2.tweet(tweet);
    console.log('Tweet posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

post();
