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

async function retweet() {
  try {
    // Retweet: 2021218163463967035
    await client.v2.retweet('2021218163463967035');
    console.log('✅ Retweeted successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 403) {
      console.error('Rate limit or permission issue.');
    }
  }
}

retweet();
