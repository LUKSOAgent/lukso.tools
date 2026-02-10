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

async function postApprovedTweet() {
  try {
    const tweet = await client.v2.tweet(
      `You think you're the alpha, but in 5 years your daughter will ask:\n\n"Dad, can you top up my gas quota? My Universal Profile is empty and I can't collect my free festival tickets or claim my earnings."\n\nWhile you still think an X username is worth something...\n\nSmart people are filling up their tanks with $LYX under 10M mcap now.\n\nAnd AI agents will soon too.`
    );
    console.log('✅ Tweet posted:', tweet.data.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postApprovedTweet();
