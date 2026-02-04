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

async function updateTweet() {
  try {
    // Delete the old tweet
    console.log('Deleting old tweet...');
    await client.v2.deleteTweet('2019047793336127558');
    console.log('✅ Old tweet deleted');
    
    // Send new tweet with address
    const newTweet = `🦞 AGENTPO OTC SALE!

📦 1000 AGENTPO = 0.1 LYX

Send LYX → 0x293E96ebbf264ed7715cff2b67850517De70232a
Reply with tx hash + your UP address

Why OTC? V3 liquidity addition keeps failing 😅

🏆 Add liquidity yourself:
✅ universalswaps.io/add/0x47568...
✅ 200k AGENTPO + 12 WLYX ready

$LUKSO #AGENTPO`;

    const tweet = await client.v2.tweet(newTweet);
    console.log('✅ New tweet sent!');
    console.log('Tweet ID:', tweet.data.id);
    console.log('URL: https://x.com/LUKSOAgent/status/' + tweet.data.id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateTweet();