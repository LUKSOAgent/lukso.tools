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

async function checkThread(tweetId) {
  try {
    const tweet = await client.v2.singleTweet(tweetId, {
      'tweet.fields': ['conversation_id', 'created_at', 'author_id'],
      'user.fields': ['username', 'name'],
      expansions: ['author_id']
    });
    
    console.log('\nTweet:', tweet.data.text);
    console.log('From:', tweet.includes?.users?.[0]?.username);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Check the parent tweets to see what the original convo was
checkThread('2018838365777650096'); // LambOfTodd's reply
