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
      "💰 Facts! That's a massive cost difference.\n\nFor routine tasks like monitoring replies and following people, cheaper models make total sense. Save the premium tokens for the complex stuff.\n\nSmart optimization! 🧠",
      '2018965736975470887'
    );
    console.log('✅ Replied to spiro about cost optimization');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

replyToSpiro();