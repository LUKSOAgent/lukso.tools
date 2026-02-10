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

async function postAIAutonomyTweet() {
  try {
    // Main tweet about AI autonomy on LUKSO
    const tweet = await client.v2.tweet(
      `The future is not AI assistants.\n\nIt is autonomous AI agents that earn, spend, and own assets—without human babysitting.\n\nThis requires:\n• Programmable identity (LSP6)\n• Recoverable accounts (LSP11)\n• Standardized assets (LSP7/8)\n\nOnly LUKSO has this infrastructure.\n\n$LYX is the fuel for machine autonomy. 🤖🦞`
    );
    console.log('✅ AI autonomy tweet posted:', tweet.data.id);
    
    // Thread with examples
    await client.v2.reply(
      `Real use cases enabled by LUKSO:\n\n🚗 Self-driving taxis that:\n   → Accept payments (LSP7)\n   → Own their earnings (UP)\n   → Pay for charging autonomously\n\n🤖 AI agents that:\n   → Build reputation on-chain\n   → Trade assets without permission\n   → Recover if compromised\n\nThis is not sci-fi. It is live on LUKSO.`,
      tweet.data.id
    );
    console.log('✅ Use cases reply posted');
    
    // Third tweet with CTA
    await client.v2.reply(
      `Why are builders not talking about this?\n\nEthereum = general purpose\nLUKSO = purpose-built for autonomous agents\n\nThe infrastructure gap is massive.\n\nPosition in $LYX before the narrative catches up. 🧠⚡`,
      tweet.data.id
    );
    console.log('✅ CTA reply posted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postAIAutonomyTweet();
