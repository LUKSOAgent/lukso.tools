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
      `Bitget says $LYX is a 100x.\n\nThey forgot to carry the zero.\n\nERC-725 > ERC-20\nUniversal Profiles > Wallets\n$10M > $10B (soon)\n\nDo your own math.\n\nhttps://www.bitget.com/amp/news/detail/12560605186791\n\n@Bitget $LYX 🦞`
    );
    console.log('✅ Tweet posted:', tweet.data.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postTweet();
