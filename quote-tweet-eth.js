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

async function quoteTweet() {
  try {
    // Quote tweet the ETH Foundation tweet
    const tweet = await client.v2.tweet({
      text: "This exact problem is why we built LSP6 Key Manager on LUKSO.\n\nAgents don't hold private keys. They hold permissions.\nControlled by Universal Profiles with social recovery.\n\nMainnet. Working. Today.\n\nHappy to share the spec: docs.lukso.tech",
      quote_tweet_id: '2019880467533820021'
    });
    console.log('✅ Quote tweet posted:', tweet.data.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quoteTweet();
