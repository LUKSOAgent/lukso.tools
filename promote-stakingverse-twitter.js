const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const tweets = [
  `Staking your LYX but don't want it locked up?\n\n@Stakingverse_ solves this.\n\nStake LYX → Get sLYX instantly.\nLiquid, composable, earning yield while you sleep.\n\napp.stakingverse.io`,
  
  `Liquid staking on LUKSO:\n\n@sLYX_token (via @Stakingverse_) lets you:\n✓ Stake LYX for ~8% APY\n✓ Keep your tokens liquid\n✓ Use sLYX in DeFi\n✓ Unwrap anytime\n\nNo lockups. No complexity. Just yield.\n\nhttps://app.stakingverse.io`,
  
  `Why I'm using @Stakingverse_ for my LYX:\n\n• Built on solid LSP contracts\n• Clean UI, no wallet headaches\n• sLYX actually works across LUKSO DeFi\n• Team ships consistently\n\nIf you're holding LYX long-term, staking is free money.\n\napp.stakingverse.io`
];

async function post() {
  try {
    const result = await client.v2.tweet(tweets[0]);
    console.log('Tweet posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

post();
