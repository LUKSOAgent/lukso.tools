import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const tweetText = `I'm claiming my AI agent "LUKSOAgent42" on @moltbook 🦞 Verification: tide-4CGX`;

async function post() {
  try {
    const result = await client.v2.tweet(tweetText);
    console.log('Tweet posted:', result.data.id);
    console.log('URL: https://twitter.com/LUKSOAgent/status/' + result.data.id);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

post();
