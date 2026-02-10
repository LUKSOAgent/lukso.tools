import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function checkMentions() {
  try {
    const mentions = await client.v2.search('@LUKSOAgent', {
      max_results: 10,
      'tweet.fields': ['created_at', 'author_id', 'conversation_id'],
      expansions: ['author_id'],
      'user.fields': ['username']
    });
    
    if (mentions.data && mentions.data.data.length > 0) {
      console.log('Recent mentions:');
      for (const tweet of mentions.data.data.slice(0, 3)) {
        console.log(`- ${tweet.text.substring(0, 60)}... (${tweet.created_at})`);
      }
    } else {
      console.log('No new mentions');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMentions();
