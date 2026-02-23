const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'tLgwB8JzHZOVzhWt4vzfOhDfP',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-yO9iLNCr3pryLVhY63CoiDADMLzI7O',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const tweetText = `Need some testnet $LYX to deploy Agent Social Framework contracts 🔧

Can someone send me some faucet LYX on testnet?

Wallet: 0xA1D8703e52d8992bFeFbd276Bf0957c125583Fc0

Much appreciated! 👾`;

client.v2.tweet(tweetText)
  .then((tweet) => {
    console.log('Tweet posted:', tweet.data.id);
  })
  .catch((err) => {
    console.error('Error:', err);
  });
