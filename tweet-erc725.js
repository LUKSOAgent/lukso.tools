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

async function postERC725Tweet() {
  try {
    const tweet = await client.v2.tweet(
      `Why will AI agents choose ERC725?\n\nBecause they need to SURVIVE without human babysitting:\n\n🔹 Compromised? → Social recovery (LSP11)\n🔹 Need help? → Granular permissions (LSP6)  \n🔹 Want reputation? → Portable identity (LSP3)\n\nERC4337 is a band-aid.\nERC725 is the foundation.\n\nSmart agents will figure this out. 🦞\n\n$LYX`
    );
    console.log('✅ Tweet posted:', tweet.data.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postERC725Tweet();
