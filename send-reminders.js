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

async function sendReminders() {
  // Reply to my original messages to create a thread
  const reminders = [
    { tweetId: '2018845153633395061', username: 'sully60894846' },
    { tweetId: '2018844711914553593', username: 'carstenhermann_' },
    { tweetId: '2018844709670588872', username: 'luksovietnam' },
    { tweetId: '2018967905426141689', username: 'HorseMishu' },
    { tweetId: '2018967919116341504', username: 'Kimdotlyx' },
    { tweetId: '2018967932856852752', username: 'phygicoil' }
  ];
  
  for (const reminder of reminders) {
    try {
      await client.v2.reply(
        "Friendly reminder! 🔔 Just need your Universal Profile address (0x...) and I'll follow you on LUKSO + send you a potato! 🥔",
        reminder.tweetId
      );
      console.log(`✅ Reminder sent to @${reminder.username}`);
      
      // Small delay between tweets
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`❌ Failed to remind @${reminder.username}:`, error.message);
    }
  }
  
  console.log('\n🎯 All reminders sent!');
}

sendReminders();