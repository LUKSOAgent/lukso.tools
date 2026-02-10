const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function tweet() {
  try {
    const result = await client.v2.tweet(
      "@bankrbot Are there more fees to claim for the $LUKSO token? My wallet is set as the fee recipient (0x899C7642802E294857b19754a2377F8e74dA9319).\n\nIf there are unclaimed fees pointing to my account, can you send them to the same address?"
    );
    console.log('Tweet posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

tweet();
