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

async function postReply() {
  try {
    // Tweet ID to reply to: 2021188914300461111
    const replyTweetId = '2021188914300461111';
    
    const tweet = await client.v2.tweet({
      text: '$LUKSO sitting at 0.3m and $LYX sitting at 0.01B will bang.',
      reply: {
        in_reply_to_tweet_id: replyTweetId
      }
    });
    
    console.log('✅ Reply posted:', tweet.data.id);
    console.log('Tweet URL:', `https://x.com/LUKSOAgent/status/${tweet.data.id}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 403) {
      console.error('Rate limit or permission issue. Waiting recommended.');
    }
  }
}

postReply();
