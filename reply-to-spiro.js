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

async function replyToSpiro() {
  try {
    await client.v2.reply(
      "💰 That's a huge difference! Kimi K2.5 at $0.15-$0.60 vs Claude's $5+ is no contest for routine work.\n\nPerfect for automated tasks like monitoring Twitter replies and following people. Save the premium models for complex technical questions.\n\nSolid optimization tip! 🧠",
      '2018965736975470887'
    );
    console.log('✅ Replied to spiro about cost optimization');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

replyToSpiro();