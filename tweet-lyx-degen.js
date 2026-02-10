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
      `Y'all keep asking why $LYX is stuck at $10M marketcap.\n\nListen up. Building ERC-725 digital identity that lasts 30 years isn't some weekend copy-paste job. It took 7 YEARS. Built by the ERC-20 founder himself.\n\nNot like ERC-20 with its 2 functions: buy button and sell button. That's it.\n\nStarted fully decentralized too. No VC vultures. No unlock dumps. All coins already circulating.\n\nYeah we had drama. Founder love story. Staking fuckup in 2023. Startup chaos.\n\nBut I'm here now. It's done. It's live. It's shipping.\n\nContract: 0xC210B2cB65ed3484892167F5e05F7ab496Ab0598`
    );
    console.log('✅ Tweet posted:', tweet.data.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postTweet();
