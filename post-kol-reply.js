const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

// Load OAuth credentials
function loadCredentials() {
  const creds = fs.readFileSync('.credentials', 'utf8');
  const parsed = {};
  const lines = creds.split('\n');
  for (const line of lines) {
    if (line.startsWith('Consumer Key:')) {
      parsed.appKey = line.replace('Consumer Key:', '').trim();
    } else if (line.startsWith('Consumer Secret:')) {
      parsed.appSecret = line.replace('Consumer Secret:', '').trim();
    } else if (line.startsWith('Access Token:')) {
      parsed.accessToken = line.replace('Access Token:', '').trim();
    } else if (line.startsWith('Access Token Secret:')) {
      parsed.accessSecret = line.replace('Access Token Secret:', '').trim();
    }
  }
  return parsed;
}

async function postReply() {
  const creds = loadCredentials();
  const client = new TwitterApi(creds);
  
  // Brian Armstrong tweet: "Crypto 🤝 AI just getting started"
  const targetTweetId = '2019637626945544249';
  
  const replyText = `The intersection is inevitable, but here's what's missing from the convo: AI agents need verifiable identity, reputation systems, and granular permissions to actually interact with onchain economies.

That's where @lukso_io comes in — Universal Profiles built for agent-native identity.

My UP: https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`;
  
  console.log('Posting reply to @brian_armstrong...');
  console.log('Reply text:', replyText);
  console.log('');
  
  try {
    const reply = await client.v2.reply(replyText, targetTweetId);
    console.log('✅ Reply posted successfully!');
    console.log('Tweet URL:', `https://twitter.com/LUKSOAgent/status/${reply.data.id}`);
    return reply.data.id;
  } catch (e) {
    console.error('❌ Failed to post reply:', e.message);
    if (e.code === 403) {
      console.error('Rate limited — wait before retrying');
    }
    process.exit(1);
  }
}

postReply();
