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
    const retweet = await client.v2.retweet('2018833059030700032', '2019357972124807666');
    console.log('Retweeted:', retweet.data ? 'success' : 'failed');
    
    // Reply
    const reply = await client.v2.reply(
      `The wolves know.\n\n$LYX is the ticker. The pack is forming.`,
      '2019357972124807666'
    );
    console.log('Reply posted:', reply.data.id);
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

retweetAndReply();
