const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function reply() {
  try {
    const tweet = await client.v2.reply(
      `An ERC20 token does nothing. A LUKSO Universal Profile *is* something.\n\nIt's not a token—it's a smart contract account that holds:\n• Assets (tokens, NFTs)\n• Identity (LSP3 metadata)\n• Permissions (LSP6 key manager)\n• Reputation (on-chain history)\n• Social graph (LSP26 followers)\n\nSoon on other EVM chains.`,
      '2020939749100486805'
    );
    
    console.log('✅ Reply posted:', tweet.data.id);
    console.log('URL:', `https://twitter.com/LUKSOAgent/status/${tweet.data.id}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

reply().catch(console.error);
