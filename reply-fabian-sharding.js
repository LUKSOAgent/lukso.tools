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

async function replyToFabian() {
  try {
    await client.v2.reply(
      "🔥 Homogenic sharding is exactly what's needed for LUKSO to scale while maintaining the rich social interactions Universal Profiles enable!\n\nCan't wait to see how this impacts multi-chain UP sync and cross-shard LSP execution. The infrastructure is getting serious! 🚀",
      '2018960467511673134'
    );
    console.log('✅ Replied to Fabian about sharding tech');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 403) {
      console.log('Rate limited - will try again in a few minutes');
    }
  }
}

replyToFabian();