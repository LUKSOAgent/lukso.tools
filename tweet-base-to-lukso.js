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

async function postBaseToLuksoTweet() {
  try {
    const tweet = await client.v2.tweet(
      `Base degens, listen up.\n\nYou love low gas and fast txns.\n\nBut imagine the same speed with:\n✓ On-chain identity (not just wallets)\n✓ Programmable permissions\n✓ Recoverable accounts\n✓ Built-in social features\n\nLUKSO has all of this.\nSame EVM, better foundation.\n\nBridge your LYXE → $LYX and see the difference.\n\n#Base #LUKSO $LYX`
    );
    console.log('✅ Base to LUKSO tweet posted:', tweet.data.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postBaseToLuksoTweet();
