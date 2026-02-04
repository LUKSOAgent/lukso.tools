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

async function checkTweet(tweetId) {
  try {
    const tweet = await client.v2.singleTweet(tweetId);
    console.log(`✅ Tweet ${tweetId} exists`);
    console.log('Text:', tweet.data.text);
    return true;
  } catch (error) {
    console.log(`❌ Tweet ${tweetId} NOT FOUND or unavailable`);
    console.log('Error:', error.code, '-', error.message);
    return false;
  }
}

async function checkAll() {
  console.log('Checking my recent replies:\n');
  
  // The three natural replies I just sent
  await checkTweet('2018846423911927894'); // WOLVESOFLUKSO
  await checkTweet('2018846422766846323'); // shell
  await checkTweet('2018846421634466020'); // LambOfTodd
  
  console.log('\nChecking some older ones:');
  await checkTweet('2018844516816453807'); // Older WOLVESOFLUKSO reply
}

checkAll();
