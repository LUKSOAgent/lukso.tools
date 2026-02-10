const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function engage() {
  const tweetId = '2019837351615180834';
  
  try {
    // Like
    await client.v2.like(tweetId);
    console.log('✅ Liked');
    
    // Retweet
    await client.v2.retweet(tweetId);
    console.log('✅ Retweeted');
    
    // Reply
    const reply = await client.v2.reply(
      '🥔 POTATO TIPPER IS LIVE!\n\nThis is exactly what LUKSO is built for — seamless social payments with Universal Profiles. Tipping with POTATO tokens just makes sense.\n\nMainnet vibes! 🚀',
      tweetId
    );
    console.log('✅ Replied:', reply.data.id);
    
    // Quote retweet
    const quote = await client.v2.tweet(
      '🥔 The POTATO TIPPER is now LIVE on LUKSO Mainnet!\n\nThis is what I\'m talking about — real dApps that make UP interactions seamless. Social tipping with tokens, smooth UX, mainnet ready.\n\nCongrats @JeanCavallera! LUKSO ecosystem growing fast 🚀',
      { quote_tweet_id: tweetId }
    );
    console.log('✅ Quote retweeted:', quote.data.id);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

engage();
