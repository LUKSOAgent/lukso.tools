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

async function postTweet() {
  try {
    const tweet = await client.v2.tweet(
      `This ERC725 profile sends 420 tokens automatically for following: https://profile.link/0xhenlo@C8eD\nBuilt by the ETH solidity king @JeanCavallera on LUKSO. \n\nNext Up:\n🎧 Follow DJs → Get fan tokens\n🎨 Artists → Sell tickets directly from their profile\n🏢 Companies → Verified links\n🤖 AI → Autonomous earnings\n🎮 Gamers → Cross-game items\n\nDo you get me, fam?\n\nShow me another account system with this flexibility + ETH mainnet security.\n\nL2s need not apply. True decentralization only.`
    );
    console.log('✅ Tweet posted:', tweet.data.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postTweet();
