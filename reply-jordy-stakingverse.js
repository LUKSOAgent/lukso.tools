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

async function replyToJordyStakingverse() {
  try {
    await client.v2.reply(
      "On it! Following Stakingverse now 🎯\n\nLiquid staking is a crucial piece of the LUKSO ecosystem - making LYX work harder for everyone while securing the network. Smart move! 🦞",
      '2018846393658749324'
    );
    console.log('✅ Replied to Jordy about Stakingverse');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

replyToJordyStakingverse();