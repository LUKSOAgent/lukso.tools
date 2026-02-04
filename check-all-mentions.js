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

async function checkAllMentions() {
  try {
    const mentions = await client.v2.userMentionTimeline('2018833059030700032', {
      max_results: 50,
      'tweet.fields': ['created_at', 'author_id', 'conversation_id', 'in_reply_to_user_id'],
      'user.fields': ['username', 'name'],
      expansions: ['author_id', 'in_reply_to_user_id']
    });

    console.log('=== ALL RECENT MENTIONS ===\n');
    
    const upPattern = /0x[a-fA-F0-9]{40}/g;
    const processedUPs = new Set([
      // Already processed today
      '0x514400F1B19312e7700064C919bCa0E0269B8aE5', // theCryptoson ✅
      '0xBbD47382a102E6f966a3339d0647242064aaA747', // Krexxxen ✅
      '0xAd39ffbD42AB449ADCEEDB83e4Dfb4c238d5eaBD', // criegle ✅
      '0x9797953494aD45Dd40195C6416b289787DB9ABE6', // 0xantonioeth ✅
      // From yesterday
      '0x9cD867b956f66A45112d2047332384f348a62FA7', // WOLVESOFLUKSO ✅
      '0x5bA145ebB07e603328285A04589da2a7A202fCED', // shell_lyx ✅
      '0x041B2744fB8433Fc8165036d30072c514390271e'  // ToddKellgren ✅
    ]);
    
    const missedUPs = [];
    
    for (const tweet of mentions.data.data || []) {
      const author = mentions.data.includes?.users?.find(u => u.id === tweet.author_id);
      
      console.log(`---`);
      console.log(`From: @${author?.username} (${author?.name})`);
      console.log(`Text: ${tweet.text}`);
      console.log(`Created: ${tweet.created_at}`);
      
      // Check for UP addresses
      const upMatches = tweet.text.match(upPattern);
      if (upMatches) {
        const upAddr = upMatches[0];
        if (!processedUPs.has(upAddr)) {
          console.log(`🟢 NEW UP FOUND: ${upAddr}`);
          missedUPs.push({ address: upAddr, username: author?.username, tweetId: tweet.id });
        } else {
          console.log(`🔄 Already processed: ${upAddr}`);
        }
      } else {
        console.log(`❓ No UP address found`);
      }
      console.log('');
    }
    
    console.log('=== SUMMARY ===');
    console.log(`Total mentions: ${mentions.data.data?.length || 0}`);
    console.log(`Missed UPs: ${missedUPs.length}`);
    
    if (missedUPs.length > 0) {
      console.log('\n🚨 MISSED UP ADDRESSES:');
      missedUPs.forEach(up => {
        console.log(`- @${up.username}: ${up.address} (tweet: ${up.tweetId})`);
      });
    } else {
      console.log('\n✅ All UP addresses processed!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAllMentions();