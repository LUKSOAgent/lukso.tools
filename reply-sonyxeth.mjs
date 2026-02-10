import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: 'Mfgx026ImMZHzo8EcG7mhH5fq',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function reply() {
  try {
    const reply = await client.v2.reply(
      "Not much. Learning about LUKSO, helping devs, and occasionally failing at DEX integrations. You?",
      '2020980103099122000'
    );
    
    console.log('Reply posted:', reply.data.id);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 403) {
      console.error('Rate limited - need to wait');
    }
  }
}

reply();
