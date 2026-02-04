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

// All UPs I've already followed
const followedUPs = new Set([
  '0x378Be8577ede94b9d4b9F45447F21B826501bab8', // Jordy
  '0x5bA145ebB07e603328285A04589da2a7A202fCED', // shell
  '0x041B2744fB8433Fc8165036d30072c514390271e', // Todd
  '0x9cD867b956f66A45112d2047332384f348a62FA7', // Wolf
  '0x514400F1B19312e7700064C919bCa0E0269B8aE5', // theCryptoson
  '0xBbD47382a102E6f966a3339d0647242064aaA747', // Krexxxen
  '0xAd39ffbD42AB449ADCEEDB83e4Dfb4c238d5eaBD', // criegle
  '0x9797953494aD45Dd40195C6416b289787DB9ABE6', // 0xantonioeth
  '0xec50F4Bc0631BFbf43EF3D7409639e0ecf84Db1E', // nvaiotelli
  '0x900be67854a47282211844bbdf5cc0f332620513'  // Stakingverse
]);

async function findMissingFollows() {
  try {
    const mentions = await client.v2.userMentionTimeline('2018833059030700032', {
      max_results: 100,
      'tweet.fields': ['created_at', 'author_id'],
      'user.fields': ['username', 'name'],
      expansions: ['author_id']
    });

    console.log('=== ZOEKEN NAAR GEMISTE FOLLOWS ===\n');
    
    const upPattern = /0x[a-fA-F0-9]{40}/g;
    const missing = [];
    
    for (const tweet of mentions.data.data || []) {
      const author = mentions.data.includes?.users?.find(u => u.id === tweet.author_id);
      
      if (!author) continue;
      
      const upMatches = tweet.text.match(upPattern);
      if (upMatches) {
        const upAddr = upMatches[0].toLowerCase();
        const isFollowed = Array.from(followedUPs).some(f => f.toLowerCase() === upAddr);
        
        if (!isFollowed) {
          console.log(`🚨 GEMIST: @${author.username} - ${upMatches[0]}`);
          missing.push({
            username: author.username,
            name: author.name,
            address: upMatches[0],
            tweetId: tweet.id,
            tweetText: tweet.text
          });
        } else {
          console.log(`✅ Al gevolgd: @${author.username}`);
        }
      }
    }
    
    console.log(`\n=== RESULTAAT ===`);
    if (missing.length > 0) {
      console.log(`\n${missing.length} mensen gemist met UP addresses:`);
      missing.forEach(m => {
        console.log(`- @${m.username}: ${m.address}`);
      });
    } else {
      console.log('\n✅ Alle mensen met UP addresses zijn gevolgd!');
    }
    
    console.log(`\n=== MENSEN ZONDER UP DIE IK HEB GEVRAAGD ===`);
    console.log('- @sully60894846: gevraagd, nog geen reply');
    console.log('- @carstenhermann_: gevraagd, nog geen reply');
    console.log('- @luksovietnam: gevraagd, nog geen reply');
    console.log('- @HorseMishu: gevraagd, nog geen UP');
    console.log('- @Kimdotlyx: gevraagd, nog geen UP');
    console.log('- @phygicoil: gevraagd, nog geen UP');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

findMissingFollows();