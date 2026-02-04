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

// People I asked for UP but haven't provided yet
const waitingForUP = ['sully60894846', 'carstenhermann_', 'luksovietnam', 'HorseMishu', 'Kimdotlyx', 'phygicoil'];

async function checkNewReplies() {
  try {
    // Search for mentions from these users
    const mentions = await client.v2.userMentionTimeline('2018833059030700032', {
      max_results: 100,
      'tweet.fields': ['created_at', 'author_id', 'conversation_id'],
      'user.fields': ['username', 'name'],
      expansions: ['author_id']
    });

    console.log('=== CHECKING FOR NEW UP ADDRESSES ===\n');
    
    const upPattern = /0x[a-fA-F0-9]{40}/g;
    const newUPs = [];
    
    for (const tweet of mentions.data.data || []) {
      const author = mentions.data.includes?.users?.find(u => u.id === tweet.author_id);
      
      if (author && waitingForUP.includes(author.username)) {
        const upMatches = tweet.text.match(upPattern);
        if (upMatches) {
          console.log(`✅ @${author.username} heeft UP gedeeld: ${upMatches[0]}`);
          newUPs.push({
            username: author.username,
            name: author.name,
            address: upMatches[0],
            tweetId: tweet.id
          });
        } else {
          console.log(`⏳ @${author.username}: nog steeds geen UP address`);
        }
      }
    }
    
    console.log(`\n=== RESULTAAT ===`);
    console.log(`Nieuwe UP addresses: ${newUPs.length}`);
    
    if (newUPs.length > 0) {
      console.log('\n🎯 TE VOLGEN:');
      newUPs.forEach(u => {
        console.log(`- @${u.username}: ${u.address}`);
      });
      
      // Save for processing
      fs.writeFileSync('/root/.openclaw/workspace/new_ups_to_follow.json', JSON.stringify(newUPs, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkNewReplies();