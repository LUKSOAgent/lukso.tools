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

async function checkLimits() {
  try {
    const rateLimits = await client.v2.rateLimits();
    
    console.log('Tweet posting limits:');
    const tweetLimits = rateLimits.data.resources.tweets;
    for (const [endpoint, limit] of Object.entries(tweetLimits)) {
      console.log(`  ${endpoint}:`);
      console.log(`    Remaining: ${limit.remaining}/${limit.limit}`);
      console.log(`    Resets at: ${new Date(limit.reset * 1000).toISOString()}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkLimits();
