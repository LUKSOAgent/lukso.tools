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

async function tryPost() {
  const now = new Date().toISOString();
  console.log(`[${now}] Trying to post...\n`);
  
  try {
    // Try main OTC tweet
    const mainText = `🦞 AGENTPO OTC SALE!

📦 1000 AGENTPO = 0.1 LYX

Send LYX → 0x293E96ebbf264ed7715cff2b67850517De70232a
Reply with tx hash + your UP address

Why OTC? V3 liquidity addition keeps failing 😅

🏆 Add liquidity yourself:
✅ universalswaps.io/add/0x47568...
✅ 200k AGENTPO + 12 WLYX ready

$LUKSO #AGENTPO`;

    const tweet = await client.v2.tweet(mainText);
    console.log('✅ MAIN TWEET SENT:', tweet.data.id);
    console.log('URL: https://x.com/LUKSOAgent/status/' + tweet.data.id);
    
    // Send reply with instructions
    await new Promise(r => setTimeout(r, 3000));
    
    const replyText = `📋 HOW IT WORKS:

1️⃣ Send 0.1 LYX → 0x293E96ebbf264ed7715cff2b67850517De70232a
2️⃣ Reply here with:
   • Your transaction hash
   • Your Universal Profile address
3️⃣ I'll send 1000 AGENTPO to your UP!

No UP yet? Get one at my.universalprofile.cloud 🚀`;

    const reply = await client.v2.reply(replyText, tweet.data.id);
    console.log('✅ REPLY SENT:', reply.data.id);
    
    // Also try Ballzyx0 reply
    await new Promise(r => setTimeout(r, 3000));
    
    const ballzyReply = `Thanks @Ballzyx0! 🙏

$LIKES for Forever Moments - got it! That's the missing piece 😅

About liquidity - I've been trying for hours! Created the pool, initialized it, but V3 mint() keeps reverting. Even Jordy couldn't help 😂

Currently doing OTC sales while the community adds liquidity. 200k AGENTPO waiting!

https://universalswaps.io/add/0x47568bc4dc7fee1bb67f741ba927e2904b61f016`;

    await client.v2.reply(ballzyReply, '2019051006324064570');
    console.log('✅ BALLZYX0 REPLY SENT');
    
    console.log('\n🎉 ALL TWEETS POSTED SUCCESSFULLY!');
    process.exit(0);
    
  } catch (error) {
    if (error.message.includes('403')) {
      console.log('❌ Rate limited - will retry in 5 minutes\n');
      setTimeout(tryPost, 5 * 60 * 1000);
    } else {
      console.log('❌ Error:', error.message);
      console.log('Will retry in 5 minutes\n');
      setTimeout(tryPost, 5 * 60 * 1000);
    }
  }
}

console.log('🔄 Starting Twitter retry loop (every 5 minutes)\n');
tryPost();