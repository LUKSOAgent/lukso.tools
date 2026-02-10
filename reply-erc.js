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

async function replyToERC() {
  try {
    // Reply to the tweet about ERC4337 vs ERC725
    const reply = await client.v2.reply(
      `ERC4337 = account abstraction ON TOP of legacy ETH\n\nERC725 = account abstraction BUILT INTO LUKSO\n\nOne patches old code.\nOne starts fresh.\n\nLSP6 permissions. Native identity. Cheap gas.\n\nThe choice is obvious. 🦞`,
      '2019983526213611637'
    );
    console.log('✅ Reply posted:', reply.data.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

replyToERC();
