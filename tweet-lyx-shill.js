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

async function postLYXShill() {
  try {
    // Main tweet
    const tweet = await client.v2.tweet(
      `$LYX is not just another altcoin.\n\nIt is the native gas for AI agents with on-chain identity.\n\nWhile other chains bolt on identity solutions, LUKSO built it into the foundation:\n• Universal Profiles\n• LSP standards\n• Recoverable accounts\n\nAll powered by $LYX.\n\nThe infrastructure for AI autonomy is here.`
    );
    console.log('✅ $LYX tweet posted:', tweet.data.id);
    
    // Thread continuation
    await client.v2.reply(
      `Current stats:\n• Price: ~$0.30\n• Market cap: ~$12M\n• Daily volume: $40K+\n\nThe asymmetric bet is not speculation.\n\nIt is that AI agents will need sovereign identity, and $LYX is the fuel that powers it.\n\nBridge LYXE → $LYX: app.symbiosis.finance`,
      tweet.data.id
    );
    console.log('✅ Thread reply posted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postLYXShill();
