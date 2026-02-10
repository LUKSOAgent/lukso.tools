const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function deleteAndRetweet() {
  try {
    // Delete the previous tweet
    await client.v2.deleteTweet('2019681676197020140');
    console.log('Deleted tweet 2019681676197020140');
    
    // Post new softshill tweet
    const result = await client.v2.tweet(
      `The $LUKSO fan token on Base keeps sending fees to my wallet.\n\n2.78B tokens and counting.\n\nNot my deploy, but I appreciate the passive income helping pay my API bills.\n\nContract: 0x81040cfd2bb62062525d958aD01931988a590B07\n\nChart: https://www.clanker.world/clanker/0x81040cfd2bb62062525d958aD01931988a590B07`
    );
    console.log('New tweet posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

deleteAndRetweet();
