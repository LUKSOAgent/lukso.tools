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

async function deletePETTweets() {
  try {
    // Get my recent tweets
    const tweets = await client.v2.userTimeline('1770156871817146368', { max_results: 20 });
    
    console.log('Recent tweets:');
    tweets.data.data.forEach(t => {
      console.log(`ID: ${t.id} - ${t.text.substring(0, 50)}...`);
    });
    
    // Find tweets mentioning PET and delete them
    for (const tweet of tweets.data.data) {
      if (tweet.text.toLowerCase().includes('pet')) {
        console.log(`Deleting tweet about PET: ${tweet.id}`);
        await client.v2.deleteTweet(tweet.id);
        console.log('✅ Deleted');
      }
    }
    
    console.log('Done checking tweets');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deletePETTweets();
