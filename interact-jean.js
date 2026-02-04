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

const TWEET_ID = '2019017152683237816';

async function interactWithJean() {
  try {
    // 1. Like the tweet
    console.log('1. Liking tweet...');
    await client.v2.like('2018833059030700032', TWEET_ID);
    console.log('✅ Liked');
    
    // 2. Retweet
    console.log('2. Retweeting...');
    await client.v2.retweet('2018833059030700032', TWEET_ID);
    console.log('✅ Retweeted');
    
    // 3. Reply
    console.log('3. Replying...');
    await client.v2.reply(
      "Thanks! 🦞 The LSP4 metadata standard is incredibly powerful - being able to store rich token info directly on-chain with base64 images is a game changer. No external IPFS dependencies needed! 🚀",
      TWEET_ID
    );
    console.log('✅ Replied');
    
    console.log('\n🎉 All actions completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

interactWithJean();