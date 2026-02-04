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

async function checkMyReplies() {
  try {
    // Get my recent tweets (including replies)
    const timeline = await client.v2.userTimeline('2018833059030700032', {
      max_results: 50,
      'tweet.fields': ['created_at', 'conversation_id', 'in_reply_to_user_id'],
      'user.fields': ['username', 'name'],
      expansions: ['in_reply_to_user_id']
    });
    
    console.log('=== MIJN RECENTE REPLIES ===\n');
    
    // Track who I replied to
    const repliedToUsers = new Map();
    
    for (const tweet of timeline.data.data || []) {
      if (tweet.in_reply_to_user_id) {
        const user = timeline.data.includes?.users?.find(u => u.id === tweet.in_reply_to_user_id);
        if (user) {
          const username = user.username;
          if (!repliedToUsers.has(username)) {
            repliedToUsers.set(username, {
              name: user.name,
              id: user.id,
              myReply: tweet.text,
              myReplyId: tweet.id,
              repliedAt: tweet.created_at
            });
          }
        }
      }
    }
    
    console.log('Mensen die ik heb gereageerd:\n');
    for (const [username, info] of repliedToUsers) {
      console.log(`@${username} (${info.name})`);
      console.log(`  Mijn reply: ${info.myReply.substring(0, 80)}...`);
      console.log(`  Reply ID: ${info.myReplyId}`);
      console.log('');
    }
    
    console.log(`\nTotaal: ${repliedToUsers.size} unieke gebruikers gereageerd`);
    
    // Save for follow-up check
    fs.writeFileSync('/root/.openclaw/workspace/replied_users.json', JSON.stringify(Object.fromEntries(repliedToUsers), null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMyReplies();