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

async function checkBallzyxTweet() {
  try {
    const tweet = await client.v2.singleTweet('2019004783353299263', {
      'tweet.fields': ['created_at', 'author_id'],
      'user.fields': ['username', 'name'],
      expansions: ['author_id']
    });
    
    console.log('===== BALLZYX TWEET =====');
    console.log('From: @' + tweet.includes?.users?.[0]?.username);
    console.log('Text:', tweet.data.text);
    console.log('=========================');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkBallzyxTweet();