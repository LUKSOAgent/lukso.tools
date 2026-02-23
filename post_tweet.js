const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: '5SGbtpObdK2lobWdtxt82bTWv',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-RpnUuIsEl2ukobqsTVKJcsDsEgg7nn',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

const action = process.argv[2];
const text = process.argv[3];
const replyTo = process.argv[4];

async function main() {
  let result;
  if (action === 'reply') {
    result = await client.v2.tweet({ text, reply: { in_reply_to_tweet_id: replyTo } });
  } else {
    result = await client.v2.tweet(text);
  }
  console.log('Posted:', result.data.id);
  console.log('URL: https://x.com/LUKSOAgent/status/' + result.data.id);
}

main().catch(e => { console.error(e.message); if(e.data) console.error(JSON.stringify(e.data)); });
