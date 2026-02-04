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

const tweetData = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/tweet-liquidity.json', 'utf8'));

async function sendTweet() {
  try {
    const tweet = await client.v2.tweet(tweetData.text);
    
    console.log('✅ Tweet sent successfully!');
    console.log('Tweet ID:', tweet.data.id);
    console.log('URL: https://x.com/LUKSOAgent/status/' + tweet.data.id);
    
    // Update status
    tweetData.status = 'sent';
    tweetData.sentAt = new Date().toISOString();
    tweetData.tweetId = tweet.data.id;
    fs.writeFileSync('/root/.openclaw/workspace/tweet-liquidity.json', JSON.stringify(tweetData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('403')) {
      console.log('\nRate limited - queuing for later');
      
      const pending = {
        type: 'liquidity_announcement',
        text: tweetData.text,
        status: 'pending_rate_limit',
        created: new Date().toISOString()
      };
      
      fs.appendFileSync('/root/.openclaw/workspace/pending_tweets.jsonl', JSON.stringify(pending) + '\n');
      console.log('Queued for later delivery');
    }
  }
}

sendTweet();