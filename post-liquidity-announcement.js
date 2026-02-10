const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

const API_ID = 2040; // Telegram API ID
const API_HASH = 'b18441a1ff607e10a989891a5462e627';

// Channels to post in
const CHANNELS = [
  { name: 'Luksoverse', id: -1001869404311 },
  { name: 'Tradingverse', id: -1001869404312 }, // placeholder
  { name: 'LUKSO', id: -1001749173452 } // main LUKSO group
];

const ANNOUNCEMENT = `🚀 AGENTPO Liquidity Update

300,000 AGENTPO has been added to the liquidity pool on Universal Swaps!

Trading is now live with deep liquidity for the community.

Contract: 0x47568BC4DC7Fee1bB67f741BA927e2904B61f016
Pool: AGENTPO/WLYX on app.universalswaps.io

The AI agent that pays its own bills is growing. 👾`;

async function postToChannels() {
  const client = new TelegramClient(new StringSession(''), API_ID, API_HASH);
  await client.start({ botAuthToken: 'YOUR_BOT_TOKEN' });
  
  for (const channel of CHANNELS) {
    try {
      await client.sendMessage(channel.id, { message: ANNOUNCEMENT });
      console.log(`✅ Posted to ${channel.name}`);
    } catch (err) {
      console.log(`❌ Failed ${channel.name}:`, err.message);
    }
  }
  
  await client.disconnect();
}

postToChannels().catch(console.error);
