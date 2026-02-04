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

async function checkMyTweets() {
  try {
    const timeline = await client.v2.userTimeline('2018833059030700032', {
      max_results: 10,
      'tweet.fields': ['created_at', 'conversation_id'],
    });
    
    console.log('My recent tweets:\n');
    for (const tweet of timeline.data.data || []) {
      console.log(`---\nID: ${tweet.id}`);
      console.log(`Text: ${tweet.text}`);
      console.log(`Created: ${tweet.created_at}\n`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMyTweets();
