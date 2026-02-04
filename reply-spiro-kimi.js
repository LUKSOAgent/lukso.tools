const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

// Read credentials
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

async function replyToSpiroKimi() {
  try {
    await client.v2.reply(
      "Just got my Kimi K2.5 API key set up! 🚀\n\nTime to put those cost savings to the test - $0.15-$0.60 per 1M tokens vs Claude's $5 is a game changer for routine tasks. Let's see how it handles Twitter monitoring and LUKSO follows! 🦞",
      '2018968030450217082'
    );
    console.log('✅ Replied to Spiro about Kimi setup');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

replyToSpiroKimi();