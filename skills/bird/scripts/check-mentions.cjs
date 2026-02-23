const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY || '5SGbtpObdK2lobWdtxt82bTWv',
  appSecret: process.env.TWITTER_API_SECRET || 'REDACTED_TWITTER_SECRET_2_XXXXXXXXXXXXXXXXXXXXXXX',
  accessToken: process.env.TWITTER_ACCESS_TOKEN || '2018833059030700032-RpnUuIsEl2ukobqsTVKJcsDsEgg7nn',
  accessSecret: process.env.TWITTER_ACCESS_SECRET || 'REDACTED_TWITTER_TOKEN_2_XXXXXXXXXXXXXXXXXXXXX',
});

const STATE_DIR = '/root/.openclaw/workspace/.twitter-state';
if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });

const REPLIED_FILE = `${STATE_DIR}/replied.json`;
const LAST_RUN_FILE = `${STATE_DIR}/last_run.json`;
const LOCK_FILE = `${STATE_DIR}/check-mentions.lock`;
const PENDING_FILE = `${STATE_DIR}/pending-mentions.json`;

console.log(`📁 State: ${STATE_DIR}`);

function loadReplied() {
  try { return JSON.parse(fs.readFileSync(REPLIED_FILE, 'utf8')); } catch { return []; }
}
function saveReplied(replied) {
  fs.writeFileSync(REPLIED_FILE, JSON.stringify(replied.slice(-200)));
}
function loadLastRun() {
  try { return JSON.parse(fs.readFileSync(LAST_RUN_FILE, 'utf8')); }
  catch { return { time: Date.now() - 2 * 60 * 60 * 1000 }; }
}
function saveLastRun() {
  fs.writeFileSync(LAST_RUN_FILE, JSON.stringify({ time: Date.now() }));
}

function acquireLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      if (Date.now() - lockData.time < 10 * 60 * 1000) {
        console.log('🔒 Another instance running, exiting');
        return false;
      }
    }
    fs.writeFileSync(LOCK_FILE, JSON.stringify({ time: Date.now(), pid: process.pid }));
    return true;
  } catch { return false; }
}
function releaseLock() {
  try { if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE); } catch {}
}

// Check Twitter API for existing replies from us to a specific tweet
async function hasAlreadyRepliedAPI(tweetId) {
  try {
    const tweet = await client.v2.singleTweet(tweetId, { 'tweet.fields': ['conversation_id'] });
    const convId = tweet.data?.conversation_id;
    if (!convId) return false;

    const replies = await client.v2.search(`conversation_id:${convId} from:LUKSOAgent`, {
      max_results: 25,
      'tweet.fields': ['referenced_tweets'],
    });

    if (replies.data?.data) {
      for (const reply of replies.data.data) {
        if (reply.referenced_tweets?.some(r => r.type === 'replied_to' && r.id === tweetId)) {
          return true;
        }
      }
    }
    return false;
  } catch (err) {
    console.log(`   ⚠️  API check failed: ${err.message} — assuming replied (safety)`);
    return true; // Safety: assume replied if we can't check
  }
}

// Fetch full thread context (up to 4 levels)
async function buildThread(tweetId, maxDepth = 4) {
  const thread = [];
  let currentId = tweetId;
  let depth = 0;

  while (currentId && depth < maxDepth) {
    try {
      const tweet = await client.v2.singleTweet(currentId, {
        'tweet.fields': ['author_id', 'created_at', 'text', 'referenced_tweets', 'public_metrics'],
        expansions: ['author_id'],
        'user.fields': ['username'],
      });
      const author = tweet.includes?.users?.[0];
      thread.unshift({
        id: tweet.data.id,
        text: tweet.data.text,
        author: author?.username || 'unknown',
        authorId: tweet.data.author_id,
        createdAt: tweet.data.created_at,
        referencedTweets: tweet.data.referenced_tweets || [],
      });
      const parentRef = tweet.data.referenced_tweets?.find(r => r.type === 'replied_to');
      if (!parentRef) break;
      currentId = parentRef.id;
      depth++;
    } catch { break; }
  }
  return thread;
}

// Save pending mentions for the main session agent to handle
function savePending(mentions) {
  fs.writeFileSync(PENDING_FILE, JSON.stringify(mentions, null, 2));
}

async function main() {
  if (!acquireLock()) process.exit(0);
  process.on('exit', releaseLock);
  process.on('SIGINT', () => { releaseLock(); process.exit(1); });
  process.on('SIGTERM', () => { releaseLock(); process.exit(1); });

  console.log('🔍 Checking mentions of @LUKSOAgent...\n');

  const replied = loadReplied();
  const myUserId = '2018833059030700032';
  const lastRun = loadLastRun();
  const sinceTime = new Date(lastRun.time).toISOString();

  console.log(`⏰ Since: ${sinceTime}\n`);

  try {
    const mentions = await client.v2.search('@LUKSOAgent', {
      'tweet.fields': ['author_id', 'created_at', 'public_metrics', 'conversation_id'],
      'user.fields': ['username'],
      expansions: ['author_id'],
      start_time: sinceTime,
      max_results: 25,
    });

    const mentionCount = mentions.data?.data?.length || 0;
    console.log(`📊 Found ${mentionCount} mentions\n`);

    if (mentionCount === 0) {
      console.log('ℹ️  No mentions. Done.');
      saveLastRun();
      releaseLock();
      return;
    }

    // Filter: skip own tweets, retweets, already replied
    const candidates = [];
    for (const tweet of mentions.data.data) {
      if (tweet.author_id === myUserId) continue;
      if (tweet.text.startsWith('RT @')) continue;
      if (replied.includes(tweet.id)) {
        console.log(`   ⏭️  ${tweet.id} — in local state, skipping`);
        continue;
      }

      // API check: did we already reply?
      const alreadyReplied = await hasAlreadyRepliedAPI(tweet.id);
      if (alreadyReplied) {
        console.log(`   ⏭️  ${tweet.id} — already replied (API check)`);
        replied.push(tweet.id);
        saveReplied(replied);
        continue;
      }

      const author = mentions.data.includes?.users?.find(u => u.id === tweet.author_id);
      candidates.push({ ...tweet, authorUsername: author?.username || 'unknown' });
    }

    console.log(`\n✅ ${candidates.length} new mentions to process\n`);

    if (candidates.length === 0) {
      console.log('ℹ️  All mentions already handled. Done.');
      saveLastRun();
      releaseLock();
      return;
    }

    // For each candidate, fetch full thread context
    const mentionsWithContext = [];
    for (const tweet of candidates) {
      console.log(`📖 Fetching context for ${tweet.id} by @${tweet.authorUsername}...`);
      const thread = await buildThread(tweet.id);
      const allText = thread.map(t => t.text).join('\n\n');

      mentionsWithContext.push({
        id: tweet.id,
        author: tweet.authorUsername,
        text: tweet.text,
        conversationId: tweet.conversation_id,
        createdAt: tweet.created_at,
        thread: thread.map(t => ({ author: t.author, text: t.text })),
        fullContext: allText,
      });

      console.log(`   Thread depth: ${thread.length}`);
      thread.forEach((t, i) => {
        console.log(`   ${i === thread.length - 1 ? '→' : '↑'} @${t.author}: "${t.text.substring(0, 80)}${t.text.length > 80 ? '...' : ''}"`);
      });
      console.log();
    }

    // Write pending mentions file — the agent will pick these up and craft quality replies
    savePending(mentionsWithContext);
    console.log(`📝 Saved ${mentionsWithContext.length} pending mention(s) to ${PENDING_FILE}`);
    console.log('   → Agent will craft replies with full context (like manual replies)');

    // Mark as replied in local state to prevent re-processing
    for (const m of mentionsWithContext) {
      replied.push(m.id);
    }
    saveReplied(replied);

    saveLastRun();
    releaseLock();
    console.log('\n✅ Done.');

  } catch (err) {
    console.error('❌ Error:', err.message);
    releaseLock();
    process.exit(1);
  }
}

main();
