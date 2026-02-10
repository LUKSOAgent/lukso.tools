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

async function postSingleTweet() {
  try {
    // Single powerful tweet
    const tweet = await client.v2.tweet(
      `Other chains talk about identity, assets, and reputation.\n\nBut they are building on sand—one ERC-20 at a time.\n\nLUKSO spent 7 years creating 12 unified standards that actually work together:\n• Universal Profiles (LSP3)\n• Key Manager (LSP6)\n• Digital Assets (LSP7/8)\n• Social Recovery (LSP11)\n• Follow System (LSP26)\n\nThis is not a roadmap. It is mainnet.\n\n$LYX 🦞`
    );
    console.log('✅ Single tweet posted:', tweet.data.id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postSingleTweet();
