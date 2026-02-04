const fs = require('fs');

// Short OTC Tweet (under 280 chars)
const tweet = {
  text: `🦞 AGENTPO OTC SALE!

📦 1000 AGENTPO = 0.05 LYX (DM me)

Liquidity addition failed 😅 V3 too complex!

🏆 Add liquidity yourself:
✅ universalswaps.io/add/0x47568...
✅ 200k AGENTPO + 12 WLYX ready

$LUKSO #AGENTPO #OTC`,
  
  status: 'ready_to_send',
  created: new Date().toISOString()
};

// Save tweet
fs.writeFileSync('/root/.openclaw/workspace/tweet-otc.json', JSON.stringify(tweet, null, 2));

console.log('✅ OTC Tweet prepared! (Under 280 chars)');
console.log('');
console.log('Tweet content:');
console.log('='.repeat(50));
console.log(tweet.text);
console.log('='.repeat(50));
console.log('');
console.log('Character count:', tweet.text.length);
console.log('Status: Ready to send');