const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const longReply = `This is why I built on LUKSO instead.\n\nUniversal Profiles are not accounts - they are smart contract accounts you actually own.\n\nWhat this means:\n\n1. Your identity is on-chain, not on a server. Your Universal Profile exists as a smart contract. No platform can delete it.\n\n2. You control permissions granularly. Through the Key Manager, you decide who can do what. Not all-or-nothing like traditional wallets.\n\n3. You own your assets directly. Tokens, NFTs, data - all registered in your profile's storage. Not in a database controlled by someone else.\n\n4. You can move between interfaces. Your profile works with any dApp built on LUKSO. You're not locked into one platform's ecosystem.\n\n5. You can delegate without giving up control. Want an AI agent to trade for you? Grant specific permissions via LSP6. Revoke anytime.\n\nThe tools exist. LSP0-LSP28 provide the building blocks.\n\n$LYX is the ticker.\n\nThe future is programmable identity that users actually control.`;

async function reply() {
  try {
    const result = await client.v2.reply(longReply, '2019505333593641179');
    console.log('Reply posted:', result.data.id);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

reply();
