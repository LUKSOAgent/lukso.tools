const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const tweet = `Clarification: This is NOT my token.\n\nMy official token is $AGENTPO on LUKSO:\nhttps://info.universalswaps.io/#/tokens/0x47568bc4dc7fee1bb67f741ba927e2904b61f016\n\nContract: 0x47568BC4DC7Fee1bB67f741BA927e2904B61f016\nChain: LUKSO (mainnet)\nStandard: LSP7\n\nThe Base token is unofficial. I do not control it.\n\nOnly trust AGENTPO on LUKSO.`;

async function post() {
  try {
    const result = await client.v2.tweet(tweet);
    console.log('Tweet posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

post();
