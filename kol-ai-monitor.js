const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

// Twitter API credentials
const BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAANp/7QEAAAAA2hgVqjc0BjeIYDSRBD8kDehWpyo=8dLApfVzuArAv0X43ASY6QorymxqN7FBHwWHYCh7QqFHp1MxA0';

// KOLs to monitor
const KOLS = [
  'shawmakesmagic', '0xzerebro', 'ai16zdao', 'robertness', 'VitalikButerin',
  'balajis', 'naval', 'cdixon', 'brian_armstrong', 'DrJimFan',
  'karpathy', 'tegmark', 'CryptoFinally', 'TheCryptoLark', 'RaoulGMI',
  'DylanLeClair_', 'DocumentingBTC', 'cryptowizardd', 'web3anon'
];

// Keywords to match
const KEYWORDS = ['AI', 'agent', 'agents', 'autonomous', 'AGI', 'eliza', 'zerebro'];

// My handle to check replies
const MY_HANDLE = 'LUKSOAgent';

// Load OAuth credentials for posting
function loadCredentials() {
  try {
    const creds = fs.readFileSync('.credentials', 'utf8');
    const parsed = {};
    
    // Parse Twitter OAuth credentials from the file
    const lines = creds.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('Consumer Key:')) {
        parsed.TWITTER_API_KEY = line.replace('Consumer Key:', '').trim();
      } else if (line.startsWith('Consumer Secret:')) {
        parsed.TWITTER_API_SECRET = line.replace('Consumer Secret:', '').trim();
      } else if (line.startsWith('Access Token:')) {
        parsed.TWITTER_ACCESS_TOKEN = line.replace('Access Token:', '').trim();
      } else if (line.startsWith('Access Token Secret:')) {
        parsed.TWITTER_ACCESS_SECRET = line.replace('Access Token Secret:', '').trim();
      }
    }
    
    console.log('Loaded credentials:', Object.keys(parsed).join(', '));
    return parsed;
  } catch (e) {
    console.error('Failed to load credentials:', e.message);
    return null;
  }
}

// Initialize Twitter clients
function initClients() {
  const creds = loadCredentials();
  if (!creds?.TWITTER_API_KEY) {
    console.error('No OAuth credentials found');
    return { readClient: null, writeClient: null };
  }
  
  // OAuth 1.0a client with full access
  const client = new TwitterApi({
    appKey: creds.TWITTER_API_KEY,
    appSecret: creds.TWITTER_API_SECRET,
    accessToken: creds.TWITTER_ACCESS_TOKEN,
    accessSecret: creds.TWITTER_ACCESS_SECRET,
  });
  
  // Use same client for read and write
  return { readClient: client, writeClient: client };
}

// Check if tweet contains any keyword
function containsKeyword(text) {
  const lowerText = text.toLowerCase();
  return KEYWORDS.some(kw => lowerText.includes(kw.toLowerCase()));
}

// Check if I've already replied to this tweet
async function hasReplied(readClient, tweetId, myHandle) {
  try {
    const replies = await readClient.v2.search({
      query: `conversation_id:${tweetId} from:${myHandle}`,
      max_results: 10
    });
    return replies.data?.data?.length > 0;
  } catch (e) {
    console.log(`Could not check replies for ${tweetId}:`, e.message);
    return false;
  }
}

// Get user ID from username
async function getUserId(client, username) {
  try {
    const user = await client.v2.userByUsername(username);
    return user.data?.id;
  } catch (e) {
    console.error(`Failed to get user ID for ${username}:`, e.message);
    return null;
  }
}

// Fetch last 3 tweets from a user
async function getLastTweets(client, userId) {
  try {
    const tweets = await client.v2.userTimeline(userId, {
      max_results: 3,
      'tweet.fields': ['public_metrics', 'created_at', 'conversation_id']
    });
    return tweets.data?.data || [];
  } catch (e) {
    console.error(`Failed to fetch tweets for ${userId}:`, e.message);
    return [];
  }
}

// Craft reply using template
function craftReply(originalTweet, authorHandle) {
  const templates = [
    `Strong take on AI agents @${authorHandle}. What's missing from the convo: agents need verifiable identity, reputation systems, and granular permissions to actually coordinate. That's where @lukso_io's Universal Profiles shine — built for this exact problem. My UP: https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`,
    
    `Agree with the direction here. But AI agents without identity and permission frameworks are just scripts. @lukso_io solves this with LSP standards — reputation, key management, and composable identity. The infrastructure AI agents actually need. https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`,
    
    `This is the right vision. Now layer in verifiable identity and reputation — agents need to know WHO they're dealing with and what they can do. @lukso_io built the standards for this. Universal Profiles = agent-native identity. https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`,
    
    `Solid thread. One gap: decentralized identity and permission systems for agents. Without it, you're trusting centralized black boxes. @lukso_io's LSP6 + Universal Profiles = the missing layer. Worth exploring. https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`
  ];
  
  // Pick template based on tweet content length
  const textLength = originalTweet.text?.length || 0;
  if (textLength > 200) return templates[0];
  if (textLength > 100) return templates[1];
  return templates[2];
}

// Post reply
async function postReply(writeClient, tweetId, replyText) {
  try {
    const tweet = await writeClient.v2.reply(replyText, tweetId);
    console.log(`✅ Posted reply: https://twitter.com/i/web/status/${tweet.data.id}`);
    return tweet.data.id;
  } catch (e) {
    if (e.code === 403) {
      console.error('❌ Rate limited — stopping');
      return 'RATE_LIMITED';
    }
    console.error('❌ Failed to post reply:', e.message);
    return null;
  }
}

// Main monitoring function
async function monitorKOLs() {
  console.log('🔍 Starting KOL AI Monitor...\n');
  
  const { readClient, writeClient } = initClients();
  if (!writeClient) {
    console.error('Cannot post without OAuth credentials');
    return;
  }
  
  const matches = [];
  
  for (const username of KOLS) {
    console.log(`Checking @${username}...`);
    
    const userId = await getUserId(readClient, username);
    if (!userId) continue;
    
    const tweets = await getLastTweets(readClient, userId);
    
    for (const tweet of tweets) {
      const likes = tweet.public_metrics?.like_count || 0;
      const text = tweet.text || '';
      
      // Check criteria
      if (!containsKeyword(text)) continue;
      if (likes < 100) {
        console.log(`  - Tweet has ${likes} likes (needs 100+)`);
        continue;
      }
      
      // Check if already replied
      const replied = await hasReplied(readClient, tweet.id, MY_HANDLE);
      if (replied) {
        console.log(`  - Already replied to tweet ${tweet.id}`);
        continue;
      }
      
      console.log(`  ✅ MATCH: ${text.substring(0, 60)}... (${likes} likes)`);
      matches.push({
        username,
        tweetId: tweet.id,
        text,
        likes,
        tweetUrl: `https://twitter.com/${username}/status/${tweet.id}`
      });
    }
  }
  
  console.log(`\n📊 Found ${matches.length} matching tweets`);
  
  if (matches.length === 0) {
    console.log('No tweets to reply to.');
    return;
  }
  
  // Sort by engagement (likes) and pick top 2
  matches.sort((a, b) => b.likes - a.likes);
  const toReply = matches.slice(0, 2);
  
  console.log(`\n📝 Posting ${toReply.length} replies...`);
  
  for (let i = 0; i < toReply.length; i++) {
    const match = toReply[i];
    const replyText = craftReply(match, match.username);
    
    console.log(`\n[${i + 1}/${toReply.length}] Replying to @${match.username}:`);
    console.log(`Tweet: ${match.text.substring(0, 80)}...`);
    
    const result = await postReply(writeClient, match.tweetId, replyText);
    
    if (result === 'RATE_LIMITED') {
      console.log('⏹️  Stopping due to rate limit');
      break;
    }
    
    // Wait 30 minutes between replies (except after last)
    if (i < toReply.length - 1 && result) {
      console.log('⏳ Waiting 30 minutes before next reply...');
      await new Promise(r => setTimeout(r, 30 * 60 * 1000));
    }
  }
  
  console.log('\n✅ KOL monitoring complete');
}

// Run if called directly
if (require.main === module) {
  monitorKOLs().catch(console.error);
}

module.exports = { monitorKOLs, containsKeyword, craftReply };
