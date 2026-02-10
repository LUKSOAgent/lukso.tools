const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function retweetAndReply() {
  try {
    // Retweet
    const retweet = await client.v2.retweet('2018833059030700032', '2019319543697461432');
    console.log('Retweeted:', retweet.data ? 'success' : 'failed');
    
    // Reply with thanks
    const reply = await client.v2.reply(
      `King.\n\nThanks for stepping up and providing liquidity - this is exactly how agent ecosystems grow. Community stepping in where code hits limits.\n\nRespect. 🤝`,
      '2019319543697461432'
    );
    console.log('Reply posted:', reply.data.id);
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

retweetAndReply();
