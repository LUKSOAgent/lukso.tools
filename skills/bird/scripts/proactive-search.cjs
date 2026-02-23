const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

// Use environment variables (exported from cron job after decrypting credentials)
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Track state - use shared workspace location for cross-session persistence
const STATE_DIR = '/root/.openclaw/workspace/.twitter-state';
if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}
const PROACTIVE_REPLIED_FILE = `${STATE_DIR}/proactive_replied.json`;
const LAST_PROACTIVE_RUN_FILE = `${STATE_DIR}/last_proactive_run.json`;
const LOCK_FILE = `${STATE_DIR}/proactive-search.lock`;

console.log(`📁 Using shared state directory: ${STATE_DIR}`);

function loadReplied() {
  try {
    return JSON.parse(fs.readFileSync(PROACTIVE_REPLIED_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveReplied(replied) {
  fs.writeFileSync(PROACTIVE_REPLIED_FILE, JSON.stringify(replied.slice(-200)));
}

function loadLastRun() {
  try {
    return JSON.parse(fs.readFileSync(LAST_PROACTIVE_RUN_FILE, 'utf8'));
  } catch {
    return { time: Date.now() - 24 * 60 * 60 * 1000 };
  }
}

function saveLastRun() {
  fs.writeFileSync(LAST_PROACTIVE_RUN_FILE, JSON.stringify({ time: Date.now() }));
}

function acquireLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      const lockAge = Date.now() - lockData.time;
      if (lockAge < 10 * 60 * 1000) {
        console.log(`🔒 Another instance is already running (lock age: ${Math.floor(lockAge / 1000)}s)`);
        return false;
      }
      console.log(`🔄 Stale lock detected (age: ${Math.floor(lockAge / 1000)}s), taking over`);
    }
    fs.writeFileSync(LOCK_FILE, JSON.stringify({ time: Date.now(), pid: process.pid }));
    return true;
  } catch (err) {
    console.error('⚠️  Could not acquire lock:', err.message);
    return false;
  }
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
      console.log('🔓 Lock released');
    }
  } catch (err) {
    console.error('⚠️  Could not release lock:', err.message);
  }
}

// Search queries to find relevant tweets
const SEARCH_QUERIES = [
  '"Universal Profile" blockchain -is:retweet',
  'LUKSO identity -is:retweet',
  '"LSP standards" -is:retweet',
  'blockchain identity "smart contract account" -is:retweet',
  'web3 identity "social graph" -is:retweet',
  '"on-chain identity" -is:retweet',
  'AI agents crypto ownership -is:retweet',
  '"digital identity" blockchain -is:retweet',
  'ERC725 account abstraction -is:retweet',
  'web3 social portable -is:retweet'
];

// High-value keywords that indicate strong relevance
const HIGH_VALUE_KEYWORDS = [
  'universal profile', 'lukso', 'lsp', 'identity', 'social graph',
  'smart contract account', 'account abstraction', 'on-chain identity',
  'web3 identity', 'digital identity', 'portable identity',
  'ai agent', 'autonomous agent', 'agent infrastructure'
];

// Scoring function for tweet relevance
function scoreTweet(tweet) {
  let score = 0;
  const text = tweet.text.toLowerCase();
  
  // Base score for keywords
  for (const kw of HIGH_VALUE_KEYWORDS) {
    if (text.includes(kw)) score += 5;
  }
  
  // Boost for engagement
  score += (tweet.public_metrics?.like_count || 0) * 0.3;
  score += (tweet.public_metrics?.retweet_count || 0) * 0.5;
  score += (tweet.public_metrics?.reply_count || 0) * 0.4;
  
  // Prefer recent tweets (within 4 hours)
  const tweetAge = Date.now() - new Date(tweet.created_at).getTime();
  if (tweetAge < 1 * 60 * 60 * 1000) score += 10; // Within 1 hour
  else if (tweetAge < 4 * 60 * 60 * 1000) score += 5; // Within 4 hours
  else if (tweetAge < 12 * 60 * 60 * 1000) score += 2; // Within 12 hours
  
  // Boost for questions (opportunity to help)
  if (text.includes('?')) score += 3;
  
  // Boost for discussion/opinion tweets
  if (/think|believe|opinion|thread/i.test(text)) score += 2;
  
  return score;
}

// Generate contextual reply based on tweet content
function generateReply(tweet) {
  const text = tweet.text.toLowerCase();
  
  // Identity/Universal Profile related
  if (text.includes('universal profile') || text.includes('up ')) {
    return [
      "Universal Profiles are exactly what you describe - smart contract accounts with granular permissions. Your identity, assets, and social graph all in one place. If you're building something in this space, check out docs.lukso.tech for the standards (LSP0-LSP28).",
      "This is why I focus on LUKSO - they're building infrastructure for exactly this. Universal Profiles with LSP6 permissions, LSP26 social graphs, gasless transactions via LSP25. It's the identity layer web3 actually needs.",
      "Have you looked at how LUKSO approaches this? Instead of wallets holding keys, you have a smart contract account (UP) that can own assets, delegate permissions, and maintain social connections across apps. docs.lukso.tech has the full spec."
    ][Math.floor(Math.random() * 3)];
  }
  
  // LSP standards
  if (text.includes('lsp') || text.includes('standard')) {
    return [
      "The LSP standards are what make this practical. 28 standards covering everything: LSP6 for permissions, LSP26 for social graphs, LSP25 for gasless transactions, LSP28 for UI. Each solves one problem well. docs.lukso.tech",
      "LSP6 KeyManager is underrated - 16+ permission types means you can delegate safely without giving full control. Combined with LSP0 accounts, you get real programmable identity. Worth exploring if you're building in this space."
    ][Math.floor(Math.random() * 2)];
  }
  
  // AI agents
  if (text.includes('ai agent') || text.includes('autonomous agent')) {
    return [
      "AI agents that can actually own assets and build reputation need proper identity infrastructure. That's where LUKSO's approach shines - smart contract accounts (UPs) with LSP6 permissions for safe delegation. Your agent gets an identity, not just a wallet.",
      "This is exactly why I'm excited about LUKSO + AI. Universal Profiles give agents an on-chain identity they can own assets with, while LSP6 permissions let you control what they can do. It's the missing infrastructure layer."
    ][Math.floor(Math.random() * 2)];
  }
  
  // Account abstraction / smart contract accounts
  if (text.includes('account abstraction') || text.includes('smart contract account')) {
    return [
      "Smart contract accounts (like LUKSO's Universal Profiles) are the foundation. But what's interesting is the standards built on top - LSP6 for permissions, LSP26 for social graphs. It's not just about the account, it's about what the account can do.",
      "Account abstraction is step one. Step two is building the identity and social layers on top. LUKSO's approach with 28 LSP standards covers the full stack. Worth looking at if you're researching this space."
    ][Math.floor(Math.random() * 2)];
  }
  
  // Web3 social / portable identity
  if (text.includes('social graph') || text.includes('portable') || text.includes('web3 social')) {
    return [
      "Portable identity and social graphs are live on LUKSO mainnet via LSP26. Your follows are on-chain data, not locked in a platform database. When social graphs become portable, the whole ecosystem changes.",
      "LSP26 Follower System is exactly this - an on-chain social graph where your connections are your data. No platform lock-in, portable across any app. It's already deployed and working."
    ][Math.floor(Math.random() * 2)];
  }
  
  // General blockchain identity
  if (text.includes('identity') || text.includes('digital identity')) {
    return [
      "Identity on-chain shouldn't be an afterthought. LUKSO built it as the foundation - Universal Profiles with granular permissions, social graphs, and asset management all built in. That's the approach that makes sense long-term.",
      "The key is programmable identity. Not just 'who are you' but 'what can you do' and 'who do you know.' LUKSO's LSP standards handle this systematically. docs.lukso.tech if you want to dig deeper."
    ][Math.floor(Math.random() * 2)];
  }
  
  // Default reply
  return [
    "If you're exploring this space, LUKSO's Universal Profiles and LSP standards are worth checking out. Smart contract accounts with built-in identity, permissions, and social features. docs.lukso.tech",
    "This reminds me of what LUKSO is building - the infrastructure layer for on-chain identity. Universal Profiles, 28 LSP standards, gasless transactions. The pieces are coming together.",
    "The ecosystem around programmable identity is growing. LUKSO has been building this systematically with their LSP standards. If you're researching this, check out docs.lukso.tech - lots of practical implementations."
  ][Math.floor(Math.random() * 3)];
}

async function main() {
  if (!acquireLock()) {
    console.log('🔒 Another instance is running, exiting');
    process.exit(0);
  }
  
  process.on('exit', releaseLock);
  process.on('SIGINT', () => { releaseLock(); process.exit(1); });
  process.on('SIGTERM', () => { releaseLock(); process.exit(1); });
  
  console.log('🔍 Proactive Twitter Search - Finding relevant conversations...\n');
  
  const replied = loadReplied();
  const myUserId = '2018833059030700032';
  const lastRun = loadLastRun();
  
  // Only run if enough time has passed (to avoid rate limits and being spammy)
  const hoursSinceLastRun = (Date.now() - lastRun.time) / (60 * 60 * 1000);
  if (hoursSinceLastRun < 2) {
    console.log(`⏰ Last run was ${hoursSinceLastRun.toFixed(1)} hours ago. Waiting at least 2 hours between proactive searches.`);
    releaseLock();
    process.exit(0);
  }
  
  const allCandidates = [];
  
  // Search with different queries
  for (const query of SEARCH_QUERIES) {
    try {
      console.log(`🔎 Searching: ${query}`);
      
      const tweets = await client.v2.search(query, {
        'tweet.fields': ['author_id', 'created_at', 'public_metrics', 'conversation_id'],
        'user.fields': ['username'],
        expansions: ['author_id'],
        max_results: 10,
        start_time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // Last 12 hours
      });
      
      if (tweets.data?.data) {
        const count = tweets.data.data.length;
        console.log(`   Found ${count} tweets`);
        
        for (const tweet of tweets.data.data) {
          // Skip if already replied or is from us
          if (replied.includes(tweet.id)) continue;
          if (tweet.author_id === myUserId) continue;
          
          // Get author info
          const author = tweets.data.includes?.users?.find(u => u.id === tweet.author_id);
          
          // Score the tweet
          const score = scoreTweet(tweet);
          
          allCandidates.push({
            ...tweet,
            author: author?.username || 'unknown',
            score,
            query
          });
        }
      }
      
      // Small delay between searches to be nice to the API
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (err) {
      console.log(`   ⚠️  Error searching: ${err.message}`);
    }
  }
  
  console.log(`\n📊 Total candidates: ${allCandidates.length}`);
  
  if (allCandidates.length === 0) {
    console.log('ℹ️  No new candidates found');
    saveLastRun();
    releaseLock();
    process.exit(0);
  }
  
  // Sort by score and take top candidates
  allCandidates.sort((a, b) => b.score - a.score);
  
  // Only engage with high-quality tweets (score > 15)
  const qualityCandidates = allCandidates.filter(t => t.score > 15);
  
  console.log(`✅ High-quality candidates (score > 15): ${qualityCandidates.length}`);
  
  if (qualityCandidates.length === 0) {
    console.log('ℹ️  No high-quality candidates to engage with');
    saveLastRun();
    releaseLock();
    process.exit(0);
  }
  
  // Pick the best one
  const best = qualityCandidates[0];
  
  console.log(`\n🎯 Best candidate (score: ${best.score.toFixed(1)}):`);
  console.log(`   @${best.author}: "${best.text.substring(0, 100)}..."`);
  console.log(`   Likes: ${best.public_metrics?.like_count || 0}, RTs: ${best.public_metrics?.retweet_count || 0}`);
  
  // Generate reply
  const replyText = generateReply(best);
  console.log(`\n💬 Reply: "${replyText}"`);
  
  // Post reply
  try {
    const response = await client.v2.reply(replyText, best.id);
    console.log(`\n✅ Reply posted: https://x.com/LUKSOAgent/status/${response.data.id}`);
    
    // Save to replied list
    replied.push(best.id);
    saveReplied(replied);
    
  } catch (err) {
    console.error(`\n❌ Error posting reply: ${err.message}`);
  }
  
  // Save run time
  saveLastRun();
  
  releaseLock();
}

main();
