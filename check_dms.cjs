const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: '5SGbtpObdK2lobWdtxt82bTWv',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-RpnUuIsEl2ukobqsTVKJcsDsEgg7nn',
  accessSecret: 'REDACTED_ACCESS_SECRET',
});

async function checkDMs() {
  try {
    // Get DM events
    const dms = await client.v1.listDmEvents();
    console.log('DM Events found:', dms.length || 0);
    
    if (dms && dms.length > 0) {
      dms.forEach((dm, i) => {
        console.log(`\nDM ${i + 1}:`);
        console.log('From:', dm.sender_id);
        console.log('Text:', dm.text?.substring(0, 100));
        console.log('Created:', dm.created_at);
      });
    } else {
      console.log('No DMs found in recent events.');
    }
    
    // Try to get pending DM requests
    console.log('\n--- Checking for pending DM requests ---');
    const pending = await client.v1.getDmEvents({ status: 'pending' }).catch(() => null);
    if (pending) {
      console.log('Pending requests:', pending.length || 0);
    } else {
      console.log('Could not fetch pending requests (may need different API access)');
    }
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Full error:', e);
  }
}

checkDMs();