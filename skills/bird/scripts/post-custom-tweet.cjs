const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const text = process.argv[2];

client.v2.tweet(text)
  .then(r => {
    console.log('Posted:', r.data.id);
    console.log('URL: https://x.com/i/status/' + r.data.id);

    // Save to recent tweets
    const STATE_DIR = '/root/.openclaw/workspace/.twitter-state';
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.appendFileSync(`${STATE_DIR}/recent-tweets.json`,
      JSON.stringify({ text, time: Date.now() }) + '\n'
    );
  })
  .catch(e => {
    console.error('Failed:', e.message);
    process.exit(1);
  });
