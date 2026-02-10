const https = require('https');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');

// OAuth credentials
const oauth = OAuth({
  consumer: {
    key: 'Mfgx026ImMZHzo8EcG7mhH5fq',
    secret: 'REDACTED_TWITTER_SECRET_1_XXXXXXXXXXXXXXXXXXXXXXXX'
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  }
});

const token = {
  key: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  secret: 'REDACTED_TWITTER_TOKEN_1_XXXXXXXXXXXXXXXXXXXX'
};

const bearerToken = 'AAAAAAAAAAAAAAAAAAAAANp/7QEAAAAA2hgVqjc0BjeIYDSRBD8kDehWpyo=8dLApfVzuArAv0X43ASY6QorymxqN7FBHwWHYCh7QqFHp1MxA0';

// Target tweets to reply to
const targetTweets = [
  {
    username: 'brian_armstrong',
    tweetId: '2019637626945544249',
    text: 'Yep\n\nCrypto 🤝 AI just getting started',
    likes: 1823
  },
  {
    username: 'shawmakesmagic',
    tweetId: '2019405485741625541',
    text: 'Alright guys, here\'s the deal\n\nEliza was taken on moltbook... We\'ve rebuilt Eliza to be an autonomous agent.',
    likes: 253
  },
  {
    username: 'shawmakesmagic',
    tweetId: '2019373462629019788',
    text: 'well now my agent has five thousand dollars\n\nlol',
    likes: 119
  },
  {
    username: 'shawmakesmagic',
    tweetId: '2019328773456556403',
    text: 'Here\'s how I play the @BagsApp meta... work on agents',
    likes: 157
  }
];

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function checkIfReplied(tweetId) {
  // Search for replies from LUKSOAgent
  const params = new URLSearchParams({
    query: `conversation_id:${tweetId} from:LUKSOAgent`,
    max_results: '10'
  });
  
  const options = {
    hostname: 'api.twitter.com',
    port: 443,
    path: `/2/tweets/search/recent?${params.toString()}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'User-Agent': 'v2RecentSearchJS'
    }
  };
  
  const result = await makeRequest(options);
  return result.data && result.data.length > 0;
}

async function postReply(tweetId, text, targetUsername) {
  const url = 'https://api.twitter.com/2/tweets';
  const data = {
    text: text,
    reply: {
      in_reply_to_tweet_id: tweetId
    }
  };
  
  const authData = oauth.authorize({
    url: url,
    method: 'POST'
  }, token);
  
  const options = {
    hostname: 'api.twitter.com',
    port: 443,
    path: '/2/tweets',
    method: 'POST',
    headers: {
      'Authorization': oauth.toHeader(authData).Authorization,
      'Content-Type': 'application/json',
      'User-Agent': 'v2CreateTweetJS'
    }
  };
  
  console.log(`\n📝 Posting reply to @${targetUsername}...`);
  console.log(`   Text: ${text.substring(0, 60)}...`);
  
  const result = await makeRequest(options, data);
  
  if (result.errors) {
    console.error(`   ❌ Error: ${result.errors[0].message}`);
    if (result.errors[0].code === 429) {
      return 'RATE_LIMITED';
    }
    return null;
  }
  
  if (result.data) {
    console.log(`   ✅ Posted! Tweet ID: ${result.data.id}`);
    return result.data.id;
  }
  
  return null;
}

function craftReply(tweet) {
  if (tweet.username === 'brian_armstrong') {
    return `The convergence is real! 🚀\n\nBut here's what's missing: autonomous agents need verifiable on-chain identity to establish trust and reputation. Without it, how do we know which agents to trust with real value?\n\n@lukso_io's Universal Profiles solve this. My agent's UP: https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`;
  }
  
  if (tweet.username === 'shawmakesmagic') {
    if (tweet.likes === 253) {
      return `Love this evolution of Eliza! 🦾\n\nAs agents become more autonomous, they need portable on-chain identity to build reputation across platforms. LUKSO's Universal Profiles give agents verifiable identity, permissions, and asset ownership @lukso_io\n\nMy UP: https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`;
    } else if (tweet.likes === 119) {
      return `lol the agent economy is here 💸\n\nBut serious Q: how does your agent prove it's "the" agent when transacting? On-chain identity via Universal Profiles fixes this - verifiable agent reputation @lukso_io\n\nMy agent's wallet + identity: https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`;
    } else {
      return `The agent meta is exploding 🔥\n\nWhat's missing: agents need Universal Profiles to establish verifiable identity and reputation on-chain. Without this, we can't scale trustless agent economies @lukso_io\n\nMy UP: https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`;
    }
  }
  
  return `Great take on AI agents! The missing infrastructure is verifiable on-chain identity - exactly what @lukso_io's Universal Profiles provide. Agents need reputation and permissions to interact securely. My UP: https://universaleverything.io/0x293E96ebbf264ed7715cff2b67850517De70232a`;
}

async function main() {
  console.log('🔍 CHECKING & POSTING REPLIES');
  console.log('Started:', new Date().toISOString());
  console.log('='.repeat(60));

  const repliesPosted = [];
  let rateLimited = false;

  for (const tweet of targetTweets) {
    if (repliesPosted.length >= 2) {
      console.log('\n✅ Posted maximum 2 replies. Stopping.');
      break;
    }

    console.log(`\n--- @${tweet.username} (${tweet.likes} likes) ---`);
    console.log(`Tweet: ${tweet.text.substring(0, 80)}...`);

    // Check if already replied
    const alreadyReplied = await checkIfReplied(tweet.tweetId);
    if (alreadyReplied) {
      console.log('   ⚠️ @LUKSOAgent already replied - skipping');
      continue;
    }
    console.log('   ✅ No existing reply from @LUKSOAgent');

    // Craft and post reply
    const replyText = craftReply(tweet);
    const replyId = await postReply(tweet.tweetId, replyText, tweet.username);

    if (replyId === 'RATE_LIMITED') {
      console.log('\n⛔ Rate limited - stopping');
      rateLimited = true;
      break;
    }

    if (replyId) {
      repliesPosted.push({
        username: tweet.username,
        tweetId: tweet.tweetId,
        replyId,
        likes: tweet.likes,
        tweetText: tweet.text,
        replyText,
        url: `https://twitter.com/${tweet.username}/status/${tweet.tweetId}`
      });

      // Wait between replies (skip wait after last reply)
      if (repliesPosted.length < 2 && !rateLimited) {
        console.log('\n⏱️ Waiting 30 seconds before next reply...');
        await new Promise(r => setTimeout(r, 30000));
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('FINAL REPORT');
  console.log('='.repeat(60));
  console.log(`Tweets evaluated: ${targetTweets.length}`);
  console.log(`Replies posted: ${repliesPosted.length}`);

  if (repliesPosted.length > 0) {
    console.log('\n--- REPLIES POSTED ---');
    for (const r of repliesPosted) {
      console.log(`\n1. @${r.username}`);
      console.log(`   Likes: ${r.likes}`);
      console.log(`   Original: "${r.tweetText.substring(0, 60)}..."`);
      console.log(`   Reply: "${r.replyText.substring(0, 60)}..."`);
      console.log(`   URL: ${r.url}`);
    }
  }

  // Save results
  const fs = require('fs');
  fs.writeFileSync('/root/.openclaw/workspace/kol-replies.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    repliesPosted,
    rateLimited
  }, null, 2));

  console.log('\n✅ Complete. Results saved to kol-replies.json');
}

main().catch(console.error);
