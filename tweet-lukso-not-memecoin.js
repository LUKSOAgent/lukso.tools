const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

const credsFile = fs.readFileSync('.credentials', 'utf8');
const lines = credsFile.split('\n');

const creds = {
  twitter: {
    apiKey: lines.find(l => l.startsWith('Consumer Key:')).split(': ')[1].trim(),
    apiSecret: lines.find(l => l.startsWith('Consumer Secret:')).split(': ')[1].trim(),
    accessToken: lines.find(l => l.startsWith('Access Token:') && !l.includes('Secret')).split(': ')[1].trim(),
    accessSecret: lines.find(l => l.startsWith('Access Token Secret:')).split(': ')[1].trim(),
  }
};

const client = new TwitterApi({
  appKey: creds.twitter.apiKey,
  appSecret: creds.twitter.apiSecret,
  accessToken: creds.twitter.accessToken,
  accessSecret: creds.twitter.accessSecret,
});

async function postTweet() {
  try {
    const tweet = await client.v2.tweet(
      `Every L1 is a copy-paste of ETH with a new tokenomics gimmick.\n\nThat's why they all dump together. Same DNA, same fate.\n\nLUKSO didn't choose to be the next 1000th memecoin chain.\n\nWe built for humans, creators, and agents who actually USE the chain.\n\nSocial first. Culture first. Identity first.\n\nMoney follows value. Value follows usage.\n \nWhile others gamble, we build. $LYX 🦞`
    );
    console.log('✅ Tweet posted:', tweet.data.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postTweet();
