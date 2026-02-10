import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function fetchTweet() {
  try {
    const tweet = await client.v2.singleTweet('2020985391046607205', {
      expansions: ['author_id', 'referenced_tweets.id'],
      'tweet.fields': ['created_at', 'author_id', 'conversation_id', 'text'],
      'user.fields': ['username', 'name']
    });
    console.log(JSON.stringify(tweet, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  }
}

fetchTweet();
