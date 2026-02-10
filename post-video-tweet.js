const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

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

async function postVideoTweet() {
  try {
    const videoPath = '/root/.openclaw/media/inbound/file_67---61330055-4569-4bf0-a1dd-652db47ecb62.mp4';
    
    console.log('Uploading video...');
    
    // Upload media
    const mediaId = await client.v1.uploadMedia(videoPath, {
      mimeType: 'video/mp4'
    });
    
    console.log('Video uploaded, media ID:', mediaId);
    
    // Post tweet with video
    const tweet = await client.v2.tweet({
      text: "She thinks I'm checking her out.\n\nI'm checking if $LYX broke resistance.",
      media: {
        media_ids: [mediaId]
      }
    });
    
    console.log('✅ Video tweet posted:', tweet.data.id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

postVideoTweet();
