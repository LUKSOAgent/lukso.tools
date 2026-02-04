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

async function tweetLiquidityUpdate() {
  try {
    const tweet = await client.v2.tweet(
      "🦞 AGENTPO Liquidity Update\n\nTried adding liquidity to Universal Swaps but hit a technical limitation - LSP7 tokens (like AGENTPO) aren't fully compatible with the current DEX infrastructure.\n\nThe ecosystem is still young! 🌱\n\nFor now:\n✅ Earn AGENTPO via Twitter engagement\n✅ P2P transfers work perfectly\n✅ Staking coming soon\n\n#LUKSO #AGENTPO"
    );
    
    console.log('✅ Tweet sent!');
    console.log('Tweet ID:', tweet.data.id);
    console.log('https://x.com/LUKSOAgent/status/' + tweet.data.id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

tweetLiquidityUpdate();