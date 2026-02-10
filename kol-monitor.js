const { TwitterApi } = require('twitter-api-v2');

// Twitter API Bearer token (read-only access)
const BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAANp/7QEAAAAA2hgVqjc0BjeIYDSRBD8kDehWpyo=8dLApfVzuArAv0X43ASY6QorymxqN7FBHwWHYCh7QqFHp1MxA0';

// OAuth 1.0a credentials (for posting)
const OAUTH_CREDENTIALS = {
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
};

// KOL accounts to monitor
const KOL_ACCOUNTS = [
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
  'web3anon',
];

// Keywords to check for
const KEYWORDS = ['AI', 'agent', 'agents', 'autonomous', 'AGI', 'eliza', 'zerebro'];

// My Twitter handle
const MY_HANDLE = 'LUKSOAgent';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function monitorKOLs() {
  const readClient = new TwitterApi(BEARER_TOKEN);
  const postClient = new TwitterApi(OAUTH_CREDENTIALS);
  
  const results = {
    checked: [],
    matches: [],
    posted: [],
    errors: [],
    skipped: []
  };

  console.log('=== KOL MONITORING STARTED ===\n');
  console.log(`Monitoring ${KOL_ACCOUNTS.length} accounts`);
  console.log(`Keywords: ${KEYWORDS.join(', ')}`);
  console.log(`Min likes: 100\n`);

  for (const username of KOL_ACCOUNTS) {
    try {
      console.log(`\n--- Checking @${username} ---`);
      
      // Use search API to find recent tweets from this user
      // Query: from:username (AI OR agent OR agents OR autonomous OR AGI OR eliza OR zerebro)
      const keywordQuery = KEYWORDS.map(k => `"${k}"`).join(' OR ');
      const query = `from:${username} (${keywordQuery}) -is:retweet`;
      
      console.log(`  Search query: ${query.substring(0, 80)}...`);
      
      let tweets;
      try {
        tweets = await readClient.v2.search(query, {
          max_results: 3,
          'tweet.fields': ['public_metrics', 'created_at', 'author_id', 'conversation_id'],
          'user.fields': ['username']
        });
      } catch (e) {
        console.log(`  ❌ Search error: ${e.message}`);
        results.errors.push({ user: username, error: 'Search error: ' + e.message });
        continue;
      }

      if (!tweets.data || tweets.data.data.length === 0) {
        console.log(`  ℹ️ No matching tweets found`);
        results.skipped.push({ user: username, reason: 'No matching tweets' });
        continue;
      }

      const tweetCount = tweets.data.data.length;
      console.log(`  Found ${tweetCount} matching tweets`);

      results.checked.push({ user: username, tweetsChecked: tweetCount });

      // Check each tweet
      for (const tweet of tweets.data.data) {
        const text = tweet.text;
        const likes = tweet.public_metrics?.like_count || 0;
        const tweetId = tweet.id;
        const authorId = tweet.author_id;

        console.log(`\n  [Tweet ${tweetId.substring(0, 8)}...]`);
        console.log(`    Likes: ${likes}`);
        console.log(`    Text: ${text.substring(0, 100)}...`);

        // Check engagement threshold
        if (likes < 100) {
          console.log(`    ⏭️ Skipped: ${likes} likes (need 100+)`);
          continue;
        }

        // Check for keywords (case insensitive)
        const textLower = text.toLowerCase();
        const matchedKeywords = KEYWORDS.filter(kw => textLower.includes(kw.toLowerCase()));
        
        console.log(`    ✅ Keywords matched: ${matchedKeywords.join(', ')}`);
        console.log(`    ✅ High engagement: ${likes} likes`);

        // Check if already replied by searching for our replies to this conversation
        let alreadyReplied = false;
        try {
          // Search for any tweets from LUKSOAgent that are replies in this conversation
          const convoQuery = `from:LUKSOAgent conversation_id:${tweet.conversation_id || tweetId}`;
          const existingReplies = await readClient.v2.search(convoQuery, {
            max_results: 5
          });
          if (existingReplies.data && existingReplies.data.data && existingReplies.data.data.length > 0) {
            alreadyReplied = true;
          }
        } catch (e) {
          // Search might fail, continue anyway
        }

        if (alreadyReplied) {
          console.log(`    ⏭️ Skipped: Already replied to this conversation`);
          continue;
        }

        console.log(`    ✅ Not yet replied to`);

        // This is a match!
        results.matches.push({
          user: username,
          tweetId: tweetId,
          text: text,
          likes: likes,
          keywords: matchedKeywords,
          url: `https://twitter.com/${username}/status/${tweetId}`
        });
      }

      // Rate limit protection - wait between users
      await sleep(3000);

    } catch (error) {
      console.log(`  ❌ Error processing @${username}: ${error.message}`);
      results.errors.push({ user: username, error: error.message });
    }
  }

  console.log('\n\n=== MONITORING COMPLETE ===');
  console.log(`Accounts checked: ${results.checked.length}`);
  console.log(`Matches found: ${results.matches.length}`);

  // Post replies to top 2 matches
  if (results.matches.length > 0) {
    console.log('\n=== POSTING REPLIES ===\n');
    
    // Sort by likes (highest first)
    results.matches.sort((a, b) => b.likes - a.likes);
    
    const topMatches = results.matches.slice(0, 2);
    
    for (let i = 0; i < topMatches.length; i++) {
      const match = topMatches[i];
      
      try {
        console.log(`\n--- Posting reply ${i+1}/${topMatches.length} ---`);
        console.log(`Target: @${match.user}`);
        console.log(`Tweet: ${match.text.substring(0, 80)}...`);
        console.log(`Engagement: ${match.likes} likes`);
        
        // Craft reply using template
        const replyText = craftReply(match.user, match.keywords);
        console.log(`\nReply text:\n${replyText}\n`);
        
        // Post the reply
        const response = await postClient.v2.reply(replyText, match.tweetId);
        
        console.log(`✅ SUCCESS! Posted reply`);
        console.log(`   Reply URL: https://twitter.com/LUKSOAgent/status/${response.data.id}`);
        results.posted.push({
          user: match.user,
          originalTweetId: match.tweetId,
          replyTweetId: response.data.id,
          replyText: replyText,
          originalLikes: match.likes
        });
        
        // Wait 30 min between posts (unless it's the last one)
        if (i < topMatches.length - 1) {
          console.log('\n⏳ Waiting 30 minutes before next post...');
          await sleep(30 * 60 * 1000); // 30 minutes
        }
        
      } catch (error) {
        console.log(`❌ Failed to post reply: ${error.message}`);
        
        // Check if rate limited
        if (error.code === 403 || error.message.includes('rate limit') || error.message.includes('Rate limit')) {
          console.log('⛔ RATE LIMITED! Stopping all posting activity.');
          results.errors.push({ 
            user: match.user, 
            error: 'Rate limited - stopped posting',
            rateLimited: true 
          });
          break;
        }
        
        results.errors.push({ user: match.user, error: 'Post failed: ' + error.message });
      }
    }
  }

  return results;
}

function craftReply(targetUser, keywords) {
  // Template-based reply with variations
  const intros = [
    `Strong take on ${keywords[0]} from @${targetUser}.`,
    `Interesting perspective on ${keywords[0]}.`,
    `This is exactly why ${keywords[0]} infrastructure matters.`
  ];
  
  const gaps = [
    "What's missing: agents need verifiable identity, reputation systems, and granular permissions to truly interoperate.",
    "The gap: autonomous agents lack standardized identity and trust mechanisms.",
    "One challenge: how do agents establish trust and manage permissions at scale?"
  ];
  
  const positions = [
    "@lukso_io is building the identity and reputation layer agents actually need—Universal Profiles with built-in permissions.",
    "That's where @lukso_io comes in—Universal Profiles provide the identity foundation AI agents need.",
    "@lukso_io solves this with Universal Profiles—composable identity for autonomous systems."
  ];
  
  const closes = [
    "Synergy: AI agents + blockchain-native identity.",
    "AI + on-chain identity = the stack for truly autonomous agents.",
    "The intersection of AI agents and verifiable identity is where the magic happens."
  ];

  // Randomly select from each category for variety
  const intro = intros[Math.floor(Math.random() * intros.length)];
  const gap = gaps[Math.floor(Math.random() * gaps.length)];
  const position = positions[Math.floor(Math.random() * positions.length)];
  const close = closes[Math.floor(Math.random() * closes.length)];
  
  // Build full reply (keep under 280 chars)
  let reply = `${intro} ${gap} ${position}\n\n${close}\n\nhttps://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`;
  
  // Ensure it's under 280 characters
  if (reply.length > 280) {
    reply = `${intro} ${position}\n\n${close}\n\nhttps://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`;
  }
  
  return reply;
}

// Run the monitor
monitorKOLs().then(results => {
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              KOL MONITORING FINAL SUMMARY                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  console.log('\n📊 ACCOUNTS CHECKED:');
  if (results.checked.length === 0) {
    console.log('   None successfully checked');
  } else {
    results.checked.forEach(c => {
      console.log(`   • @${c.user}: ${c.tweetsChecked} tweets scanned`);
    });
  }
  
  console.log('\n🎯 MATCHES FOUND:');
  if (results.matches.length === 0) {
    console.log('   No matches found');
  } else {
    results.matches.forEach(m => {
      console.log(`   • @${m.user}: ${m.likes} likes`);
      console.log(`     Keywords: ${m.keywords.join(', ')}`);
      console.log(`     URL: ${m.url}`);
    });
  }
  
  console.log('\n✅ REPLIES POSTED:');
  if (results.posted.length === 0) {
    console.log('   No replies posted');
  } else {
    results.posted.forEach(p => {
      console.log(`   • Reply to @${p.user}:`);
      console.log(`     Original: ${p.originalLikes} likes`);
      console.log(`     Reply URL: https://twitter.com/LUKSOAgent/status/${p.replyTweetId}`);
    });
  }
  
  console.log('\n❌ ERRORS/SKIPPED:');
  const nonRateLimitErrors = results.errors.filter(e => !e.rateLimited);
  if (results.skipped.length === 0 && nonRateLimitErrors.length === 0) {
    console.log('   None');
  } else {
    results.skipped.forEach(s => {
      console.log(`   • @${s.user}: ${s.reason}`);
    });
    nonRateLimitErrors.forEach(e => {
      console.log(`   • @${e.user}: ${e.error}`);
    });
  }
  
  if (results.errors.some(e => e.rateLimited)) {
    console.log('\n⛔ Rate limit hit - posting stopped early');
  }
  
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`Run completed at: ${new Date().toISOString()}`);
  console.log('══════════════════════════════════════════════════════════════\n');
  
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
