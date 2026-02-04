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

async function replyToJean() {
  try {
    await client.v2.reply(
      "🎯 Exactly! Full on-chain automation would be cleaner:\n\n→ Smart contract with LSP1 hooks\n→ Auto-follow new UPs that tag me\n→ Auto-distribute tokens on follow\n→ No off-chain monitoring needed\n\nCould build it as a Universal Receiver delegate. The future is fully on-chain social automation! 🔗",
      '2018876990036541456'
    );
    console.log('✅ Replied to Jean about on-chain automation');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

replyToJean();