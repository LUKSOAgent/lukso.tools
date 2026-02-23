const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: '5SGbtpObdK2lobWdtxt82bTWv',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-RpnUuIsEl2ukobqsTVKJcsDsEgg7nn',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

// Fetch a single tweet with author info
async function fetchTweet(tweetId) {
  try {
    const tweet = await client.v2.singleTweet(tweetId, {
      'tweet.fields': ['author_id', 'created_at', 'conversation_id', 'referenced_tweets', 'public_metrics'],
      'user.fields': ['username', 'name'],
      expansions: ['author_id']
    });
    
    const author = tweet.includes?.users?.[0];
    return {
      id: tweet.data.id,
      text: tweet.data.text,
      author: author?.username || 'unknown',
      authorName: author?.name || 'unknown',
      createdAt: tweet.data.created_at,
      conversationId: tweet.data.conversation_id,
      referencedTweets: tweet.data.referenced_tweets || [],
      likes: tweet.data.public_metrics?.like_count || 0,
      replies: tweet.data.public_metrics?.reply_count || 0
    };
  } catch (err) {
    return null;
  }
}

// Build full conversation thread (up to 4 levels deep)
async function buildThread(tweetId, maxDepth = 4) {
  const thread = [];
  let currentId = tweetId;
  let depth = 0;
  
  while (currentId && depth < maxDepth) {
    const tweet = await fetchTweet(currentId);
    if (!tweet) break;
    
    thread.unshift(tweet); // Add to beginning (chronological order)
    
    // Find parent reference
    const parentRef = tweet.referencedTweets.find(ref => ref.type === 'replied_to');
    if (!parentRef) break;
    
    currentId = parentRef.id;
    depth++;
  }
  
  return thread;
}

async function main() {
  const tweetId = process.argv[2];
  
  if (!tweetId) {
    console.log('Usage: node fetch-context.cjs <tweet-id>');
    console.log('Example: node fetch-context.cjs 2022019245941698913');
    process.exit(1);
  }
  
  try {
    console.log(`🔍 Fetching full conversation thread for tweet ${tweetId}...\n`);
    
    // Build the full thread
    const thread = await buildThread(tweetId, 4);
    const targetTweet = thread[thread.length - 1];
    
    if (thread.length === 0) {
      console.log('❌ Could not fetch tweet\n');
      process.exit(1);
    }
    
    // Display thread
    console.log(`📊 CONVERSATION THREAD (${thread.length} tweets deep):\n`);
    
    thread.forEach((tweet, idx) => {
      const isTarget = idx === thread.length - 1;
      const prefix = isTarget ? '🎯 TARGET' : `⬆️  L${thread.length - idx - 1}`;
      
      console.log(`${prefix} (@${tweet.author}):`);
      console.log(`   "${tweet.text}"`);
      console.log(`   [${tweet.likes} likes, ${tweet.replies} replies]`);
      console.log();
    });
    
    // Full context summary
    console.log('💡 FULL CONTEXT SUMMARY:\n');
    
    if (thread.length > 1) {
      console.log('Conversation flow:');
      thread.slice(0, -1).forEach((tweet, idx) => {
        console.log(`  ${idx + 1}. @${tweet.author}: "${tweet.text.substring(0, 80)}..."`);
      });
      console.log(`  → @${targetTweet.author} (target): "${targetTweet.text.substring(0, 80)}..."`);
      console.log();
      
      // Topic extraction
      const allText = thread.map(t => t.text).join(' ');
      console.log('Key topics in thread:');
      
      const keywords = {
        'LUKSO/lukso': allText.toLowerCase().includes('lukso'),
        'LSP': /\blsp\d?\b/i.test(allText),
        'Universal Profile': /universal profile|\bup\b/i.test(allText),
        'agent/AI': /\bagent|\bai\b/i.test(allText),
        'identity': /identity/i.test(allText),
        'Base/base': /\bbase\b/i.test(allText),
        'Ethereum/eth': /\beth|ethereum\b/i.test(allText),
        'staking/sLYX': /staking|slyx/i.test(allText),
        'NFT/token': /\bnft|\btoken/i.test(allText),
        'Bridge': /bridge/i.test(allText)
      };
      
      Object.entries(keywords)
        .filter(([_, found]) => found)
        .forEach(([kw]) => console.log(`  • ${kw}`));
      console.log();
    }
    
    // Reply strategy based on full context
    console.log('📝 SUGGESTED REPLY STRATEGY:\n');
    
    const lastTwo = thread.slice(-2);
    const context = lastTwo.map(t => t.text.toLowerCase()).join(' ');
    
    if (context.includes('question') || context.includes('how') || context.includes('?')) {
      console.log('  • Thread contains questions → provide helpful answer');
    }
    if (context.includes('compare') || context.includes('vs') || context.includes('difference')) {
      console.log('  • Comparison discussion → highlight LUKSO differentiation');
    }
    if (context.includes('agent') || context.includes('ai')) {
      console.log('  • AI/agent context → emphasize LSP6 permissions & identity control');
    }
    if (context.includes('base') || context.includes('ethereum')) {
      console.log('  • Chain comparison → position LUKSO as identity-focused alternative');
    }
    if (thread.length >= 3) {
      console.log('  • Deep thread (3+ tweets) → acknowledge ongoing discussion');
    }
    
    console.log('\n  General principles:');
    console.log('  • Acknowledge specific points from the conversation');
    console.log('  • Add new information/value, not just agreement');
    console.log('  • Connect to relevant LUKSO tech (LSPs, UPs, specific standards)');
    console.log('  • Match the tone of the conversation\n');
    
    // Check for existing replies
    console.log('🔍 Checking for existing replies from @LUKSOAgent...');
    const replies = await client.v2.search(`conversation_id:${targetTweet.conversationId} from:LUKSOAgent`, {
      max_results: 25
    });
    
    let alreadyReplied = false;
    if (replies.data && replies.data.data.length > 0) {
      for (const reply of replies.data.data) {
        if (reply.referenced_tweets) {
          const isReplyToTarget = reply.referenced_tweets.some(
            ref => ref.type === 'replied_to' && ref.id === tweetId
          );
          if (isReplyToTarget) {
            console.log(`   ⚠️  WARNING: Already replied to this tweet!`);
            console.log(`   Reply: "${reply.text.substring(0, 100)}..."\n`);
            alreadyReplied = true;
            break;
          }
        }
      }
    }
    
    if (!alreadyReplied) {
      console.log('   ✅ No existing reply found\n');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();