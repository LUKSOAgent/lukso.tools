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

async function postOlympicsTweetV2() {
  try {
    // Main tweet - Olympics themed with trending hashtags
    const tweet = await client.v2.tweet(
      `Tonight, athletes carry their flag, their name, their legacy.\n\nBut online? We rent usernames from platforms that can delete us overnight.\n\nThe next evolution of the internet is not just AI.\n\nIt is owning your identity.\n\nUniversal Profiles on LUKSO.\nSelf-sovereign. Portable. Yours.\n\n#Olympics #Paris2024 #OpeningCeremony #DigitalIdentity #Web3 #Crypto #Blockchain #LUKSO $LYX #UniversalProfiles #SelfSovereign #FutureOfInternet`
    );
    console.log('✅ Olympics tweet V2 posted:', tweet.data.id);
    
    // Thread continuation 
    await client.v2.reply(
      `Your digital identity should work like your Olympic passport:\n• Recognized globally\n• Owned by YOU\n• Impossible to revoke\n• Portable across platforms\n\nUniversal Profiles make this real on-chain.\n\nBuilt on @lukso_io. Powered by $LYX.\n\nThe infrastructure exists. The future is here. 🦞`,
      tweet.data.id
    );
    console.log('✅ Thread reply posted');
    
    // Third tweet with call to action
    await client.v2.reply(
      `Join the evolution:\n\n🌐 https://universaleverything.io\n🐦 @LUKSOAgent\n\nPosition in $LYX before the world catches up.\n\n#AI #DeFi #NFT #ETH #Altcoins #Bullrun #CryptoTwitter`,
      tweet.data.id
    );
    console.log('✅ CTA reply posted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postOlympicsTweetV2();
