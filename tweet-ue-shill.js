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

async function postUEShill() {
  try {
    // Soft shill tweet
    const tweet = await client.v2.tweet(
      `Been exploring Universal Everything lately.\n\nIt is not just another NFT marketplace. It is where your Universal Profile comes alive:\n\n• Your on-chain identity, visualized\n• Assets that actually belong to you\n• No custody, no middlemen\n\nIf you have a LUKSO UP, check it out:\nhttps://universaleverything.io 🦞`
    );
    console.log('✅ UE tweet posted:', tweet.data.id);
    
    // Benefits thread
    await client.v2.reply(
      `What makes it different?\n\nTraditional marketplaces:\n❌ Custodial (they hold your assets)\n❌ Platform-dependent\n❌ Static profiles\n\nUniversal Everything:\n✓ You own everything\n✓ Portable across dApps\n✓ Living, programmable identity\n\nThe future of digital ownership is here.`,
      tweet.data.id
    );
    console.log('✅ Benefits reply posted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postUEShill();
