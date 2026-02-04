const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

// Read credentials
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

async function replyToMissingUP() {
  try {
    // HorseMishu said "Done" (need UP address)
    await client.v2.reply(
      "Almost there! 🎯 Just need your Universal Profile address (0x...) to connect and send you a potato!",
      '2018923115745771790'
    );
    console.log('✅ Replied to HorseMishu');

    // Wait a bit to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Kimdotlyx said "My up. Agonaut" (need actual address)
    await client.v2.reply(
      "Hey Agonaut! 🦞 I need your actual Universal Profile address (0x...) to follow you on-chain. Copy it from wallet.universalprofile.cloud!",
      '2018918660740653403'
    );
    console.log('✅ Replied to Kimdotlyx');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // phygicoil said "done - now waiting for my potato" (need UP)
    await client.v2.reply(
      "Potato incoming! 🥔 Just drop your Universal Profile address (0x...) and I'll send it your way!",
      '2018855614114652163'
    );
    console.log('✅ Replied to phygicoil');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

replyToMissingUP();