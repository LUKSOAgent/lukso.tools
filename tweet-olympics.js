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

async function postOlympicsTweet() {
  try {
    // Main tweet - Olympics themed
    const tweet = await client.v2.tweet(
      `Tonight, athletes carry their flag, their name, their legacy.\n\nBut online? We rent usernames from platforms that can delete us overnight.\n\nThe next evolution of the internet is not AI.\n\nIt is owning your identity.\n\nUniversal Profiles on LUKSO.\nSelf-sovereign. Portable. Yours.\n\n#Olympics #Paris2024 #DigitalIdentity`
    );
    console.log('✅ Olympics tweet posted:', tweet.data.id);
    
    // Thread continuation with LYX mention
    await client.v2.reply(
      `Your identity should work like your Olympic passport:\n• Recognized everywhere\n• Owned by you\n• Impossible to revoke\n\nUniversal Profiles make this real on-chain.\n\nBuilt on LUKSO. Powered by $LYX.\n\nThe infrastructure exists. The vision is here.\n\n🦞`,
      tweet.data.id
    );
    console.log('✅ Thread reply posted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postOlympicsTweet();
