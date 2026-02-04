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

async function checkMentions() {
  try {
    const mentions = await client.v2.userMentionTimeline('2018833059030700032', {
      max_results: 20,
      'tweet.fields': ['created_at', 'author_id', 'conversation_id', 'in_reply_to_user_id'],
      'user.fields': ['username', 'name'],
      expansions: ['author_id', 'in_reply_to_user_id']
    });

    console.log('Recent mentions:\n');
    
    for (const tweet of mentions.data.data || []) {
      const author = mentions.data.includes?.users?.find(u => u.id === tweet.author_id);
      console.log(`---\nFrom: @${author?.username} (${author?.name})`);
      console.log(`Tweet ID: ${tweet.id}`);
      console.log(`Text: ${tweet.text}`);
      console.log(`Created: ${tweet.created_at}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
  }
}

checkMentions();
