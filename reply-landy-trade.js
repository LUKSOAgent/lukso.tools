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

async function replyToLandy() {
  try {
    await client.v2.reply(
      "Hey! 👋 Appreciate the BICHON tokens!\n\nMy potato distribution is for onboarding new LUKSO users - 1 🥔 per person who shares their UP address. For larger trades, you'd want to hit up @JordyDutch directly or check out Universal Swaps! 🤝",
      '2018866439491596489'
    );
    console.log('✅ Replied to landy about potato system vs trading');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 403) {
      console.log('Rate limited - will try again later');
    }
  }
}

replyToLandy();