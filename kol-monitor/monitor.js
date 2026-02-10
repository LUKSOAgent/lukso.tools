const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

// Bearer token for read operations
const bearerToken = 'AAAAAAAAAAAAAAAAAAAAANp/7QEAAAAA2hgVqjc0BjeIYDSRBD8kDehWpyo=8dLApfVzuArAv0X43ASY6QorymxqN7FBHwWHYCh7QqFHp1MxA0';

// OAuth 1.0a credentials for posting
const consumerKey = 'Mfgx026ImMZHzo8EcG7mhH5fq';
const consumerSecret = 'REDACTED_TWITTER_SECRET_1_XXXXXXXXXXXXXXXXXXXXXXXX';
const accessToken = '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx';
const accessTokenSecret = 'REDACTED_TWITTER_TOKEN_1_XXXXXXXXXXXXXXXXXXXX';

// KOL accounts to monitor
const kolAccounts = [
  'shawmakesmagic',
  '0xzerebro',
  'ai16zdao',
  'robertness',
  'VitalikButerin',
  'balajis',
  'naval',
  'cdixon',
  'brian_armstrong',
  'DrJimFan',
  'karpathy',
  'tegmark',
  'CryptoFinally',
  'TheCryptoLark',
  'RaoulGMI',
  'DylanLeClair_',
  'DocumentingBTC',
  'cryptowizardd',
  'web3anon'
];

// Keywords to search for (case insensitive)
const keywords = ['AI', 'agent', 'agents', 'autonomous', 'AGI', 'eliza', 'zerebro'];

// My username
const myUsername = 'LUKSOAgent';

// Results tracking
const results = {
  checked: [],
  found: [],
  posted: [],
  errors: []
};

// Create clients
const readClient = new TwitterApi(bearerToken);
const postClient = new TwitterApi({
  appKey: consumerKey,
  appSecret: consumerSecret,
  accessToken: accessToken,
  accessSecret: accessTokenSecret,
});

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function containsKeywords(text) {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

async function getLast3Tweets(username) {
  try {
    // Get user ID first
    const user = await readClient.v2.userByUsername(username);
    if (!user.data) {
      return { username, error: 'User not found' };
    }

    // Get last 3 tweets (excluding retweets)
    const tweets = await readClient.v2.userTimeline(user.data.id, {
      max_results: 10,
      'tweet.fields': ['public_metrics', 'created_at', 'author_id', 'conversation_id'],
      exclude: ['retweets', 'replies']
    });

    return {
      username,
      userId: user.data.id,
      tweets: tweets.data ? tweets.data.data.slice(0, 3) : []
    };
  } catch (error) {
    return { username, error: error.message };
  }
}

async function hasRepliedToTweet(tweetId) {
  try {
    // Get my user ID
    const me = await postClient.v2.me();
    const myId = me.data.id;

    // Search for replies to this tweet
    const replies = await readClient.v2.search(`conversation_id:${tweetId} from:${myId}`, {
      max_results: 10,
      'tweet.fields': ['author_id', 'in_reply_to_tweet_id']
    });

    return replies.data && replies.data.data.length > 0;
  } catch (error) {
    // If we can't check, assume we haven't replied to be safe
    return false;
  }
}

function craftReply(tweetText, username) {
  // Template: Acknowledge + Gap + LUKSO solution + UP link
  const templates = [
    `@${username} 🔥 Take on agents is spot on. But agents need identity, reputation & verifiable permissions. @lukso_io fixes this with Universal Profiles. https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a - that's the missing piece.`,
    `@${username} 💯 Agents are the future. But who's building their identity layer? @lukso_io's Universal Profiles give agents reputation & trust. https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a - worth checking.`,
    `@${username} Great thread! The agent explosion needs an identity backbone. @lukso_io enables verifiable agent reputations with Universal Profiles. https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a - the infra we need.`,
    `@${username} On point 👀 Agents without identity = chaos. @lukso_io's Universal Profiles solve this with on-chain reputation & permissions. https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a - that's the play.`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

async function postReply(tweetId, text) {
  try {
    const tweet = await postClient.v2.reply(text, tweetId);
    return { success: true, tweetId: tweet.data.id };
  } catch (error) {
    return { success: false, error: error.message, code: error.code };
  }
}

async function main() {
  console.log('🚀 Starting KOL Twitter Monitor...\n');

  const matchingTweets = [];

  // Check each KOL
  for (const username of kolAccounts) {
    console.log(`Checking @${username}...`);
    results.checked.push(username);

    await delay(1000); // Rate limit safety

    const data = await getLast3Tweets(username);
    
    if (data.error) {
      console.log(`  ❌ Error: ${data.error}`);
      results.errors.push({ username, error: data.error });
      continue;
    }

    console.log(`  Found ${data.tweets.length} tweets`);

    for (const tweet of data.tweets) {
      const likes = tweet.public_metrics?.like_count || 0;
      const text = tweet.text;

      console.log(`    Tweet ${tweet.id}: ${likes} likes - "${text.substring(0, 50)}..."`);

      // Check for keywords and engagement
      if (containsKeywords(text) && likes >= 100) {
        console.log(`      ✓ Matches keywords and has ${likes} likes`);

        // Check if already replied
        const alreadyReplied = await hasRepliedToTweet(tweet.id);
        await delay(500);

        if (alreadyReplied) {
          console.log(`      ⚠ Already replied to this tweet`);
          continue;
        }

        matchingTweets.push({
          username,
          tweetId: tweet.id,
          text,
          likes,
          tweet
        });

        results.found.push({
          username,
          tweetId: tweet.id,
          text,
          likes
        });
      }
    }
  }

  console.log(`\n📊 Found ${matchingTweets.length} matching tweets`);

  // Sort by engagement (likes) descending
  matchingTweets.sort((a, b) => b.likes - a.likes);

  // Take top 2
  const topTweets = matchingTweets.slice(0, 2);

  // Post replies
  for (let i = 0; i < topTweets.length; i++) {
    const match = topTweets[i];
    
    console.log(`\n📝 Posting reply ${i + 1}/2 to @${match.username}...`);
    
    const replyText = craftReply(match.text, match.username);
    console.log(`  Reply: ${replyText}`);

    const result = await postReply(match.tweetId, replyText);

    if (result.success) {
      console.log(`  ✅ Posted! Tweet ID: ${result.tweetId}`);
      results.posted.push({
        username: match.username,
        originalTweetId: match.tweetId,
        replyTweetId: result.tweetId,
        replyText,
        likes: match.likes
      });
    } else {
      console.log(`  ❌ Failed: ${result.error} (code: ${result.code})`);
      results.errors.push({
        username: match.username,
        tweetId: match.tweetId,
        error: result.error,
        code: result.code
      });

      // Stop if rate limited
      if (result.code === 403 || result.error?.includes('rate limit')) {
        console.log('🛑 Rate limited! Stopping...');
        break;
      }
    }

    // Wait 30 minutes between posts (except after last one)
    if (i < topTweets.length - 1) {
      console.log('⏱ Waiting 30 minutes before next post...');
      await delay(30 * 60 * 1000);
    }
  }

  // Save results
  fs.writeFileSync('/root/.openclaw/workspace/kol-monitor/results.json', JSON.stringify(results, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY REPORT');
  console.log('='.repeat(60));
  console.log(`\n1. KOLs CHECKED (${results.checked.length}):`);
  results.checked.forEach(u => console.log(`   - @${u}`));
  
  console.log(`\n2. AI/AGENT TWEETS FOUND (${results.found.length}):`);
  results.found.forEach(t => {
    console.log(`   - @${t.username}: ${t.likes} likes`);
    console.log(`     Text: "${t.text.substring(0, 80)}..."`);
    console.log(`     ID: ${t.tweetId}`);
  });

  console.log(`\n3. REPLIES POSTED (${results.posted.length}):`);
  results.posted.forEach(p => {
    console.log(`   - Reply to @${p.username} (${p.likes} likes on original)`);
    console.log(`     Reply ID: ${p.replyTweetId}`);
    console.log(`     Original ID: ${p.originalTweetId}`);
  });

  if (results.errors.length > 0) {
    console.log(`\n4. ERRORS (${results.errors.length}):`);
    results.errors.forEach(e => {
      console.log(`   - @${e.username}: ${e.error}`);
      if (e.code) console.log(`     Code: ${e.code}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('Results saved to results.json');
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
