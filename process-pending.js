const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

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

async function processPendingTweets() {
  const pendingFile = '/root/.openclaw/workspace/pending_tweets.jsonl';
  
  if (!fs.existsSync(pendingFile)) {
    console.log('No pending tweets file');
    return;
  }
  
  const lines = fs.readFileSync(pendingFile, 'utf8').trim().split('\n').filter(l => l);
  const pending = lines.map(l => JSON.parse(l)).filter(t => t.status === 'pending_rate_limit');
  
  console.log(`Found ${pending.length} pending tweets\n`);
  
  const remaining = [];
  
  for (const tweet of pending) {
    try {
      if (tweet.replyTo && tweet.replyTo !== 'PARENT_TWEET_ID') {
        // It's a reply
        const reply = await client.v2.reply(tweet.text, tweet.replyTo);
        console.log('✅ Reply sent:', reply.data.id);
        tweet.status = 'sent';
        tweet.sentAt = new Date().toISOString();
      } else if (tweet.type === 'otc_with_address') {
        // Main tweet
        const newTweet = await client.v2.tweet(tweet.text);
        console.log('✅ Main tweet sent:', newTweet.data.id);
        tweet.status = 'sent';
        tweet.tweetId = newTweet.data.id;
        tweet.sentAt = new Date().toISOString();
        
        // Now send the "HOW IT WORKS" reply if we have a tweetId
        const howItWorks = pending.find(t => t.type === 'reply_to_otc' && t.text.includes('HOW IT WORKS'));
        if (howItWorks && newTweet.data.id) {
          try {
            const reply = await client.v2.reply(howItWorks.text, newTweet.data.id);
            console.log('✅ HOW IT WORKS reply sent:', reply.data.id);
            howItWorks.status = 'sent';
            howItWorks.sentAt = new Date().toISOString();
          } catch (e) {
            console.log('❌ Reply failed:', e.message);
            howItWorks.replyTo = newTweet.data.id; // Update with actual tweet ID
            remaining.push(howItWorks);
          }
        }
      } else if (!tweet.replyTo) {
        // Regular tweet
        const newTweet = await client.v2.tweet(tweet.text);
        console.log('✅ Tweet sent:', newTweet.data.id);
        tweet.status = 'sent';
        tweet.sentAt = new Date().toISOString();
      }
    } catch (error) {
      if (error.message.includes('403')) {
        console.log('⏳ Still rate limited, keeping in queue:', tweet.type);
        remaining.push(tweet);
      } else {
        console.log('❌ Error for', tweet.type, ':', error.message);
        remaining.push(tweet);
      }
    }
    
    // Small delay between tweets
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Write remaining back to file
  const allTweets = lines.map(l => JSON.parse(l));
  const updated = allTweets.map(t => {
    const match = remaining.find(r => r.created === t.created && r.type === t.type);
    return match || t;
  });
  
  fs.writeFileSync(pendingFile, updated.map(t => JSON.stringify(t)).join('\n') + '\n');
  
  console.log('\n' + '='.repeat(50));
  console.log(`Processed ${pending.length} tweets`);
  console.log(`${remaining.length} still pending (rate limit)`);
}

processPendingTweets();