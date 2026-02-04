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

async function checkStatus() {
  try {
    const me = await client.v2.me();
    console.log('✅ Account active and accessible');
    console.log('Username:', me.data.username);
    console.log('Name:', me.data.name);
    console.log('ID:', me.data.id);
    
    // Try to get recent tweets
    const timeline = await client.v2.userTimeline(me.data.id, { max_results: 5 });
    console.log('\n✅ Can access timeline');
    console.log('Recent tweets:', timeline.data.data?.length || 0);
    
  } catch (error) {
    console.error('❌ Error accessing account');
    console.error('Message:', error.message);
    if (error.code) {
      console.error('Code:', error.code);
    }
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
  }
}

checkStatus();
