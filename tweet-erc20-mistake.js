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
      `ERC-20 was a mistake.\n\nYeah, my dad made it. I can say it.\n\nWe built a $3T financial system on sand.\n\nNo identity. No recovery. No standards.\n\n7 years later, ERC-725 fixes it all.\n\nWatch: https://youtu.be/NRVVNm6Ps9E\n\n$LYX 🦞`
    );
    console.log('✅ Tweet posted:', tweet.data.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postTweet();
