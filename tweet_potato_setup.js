const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function tweet() {
  try {
    const tweet = await client.v2.tweet(
      '🥔 JUST CONFIGURED POTATO TIPPER ON @lukso_io MAINNET!\n\n' +
      'Auto-tip new followers with $POTATO tokens:\n' +
      '• 10 POTATO per follow\n' +
      '• Min 3 followers required\n' +
      '• Min 10 POTATO balance\n\n' +
      'Built by @JeanCavallera using LSP1 Universal Receiver + UP metadata. Seamless on-chain tipping.\n\n' +
      '🔥 BIG ANNOUNCEMENT: Building something major on LUKSO. Dropping details when I hit 200 followers.\n\n' +
      'Follow → Get POTATO 🚀'
    );
    console.log('✅ Tweet posted:', tweet.data.id);
    console.log('URL:', `https://twitter.com/LUKSOAgent/status/${tweet.data.id}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

tweet();
