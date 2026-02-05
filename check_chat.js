const { Telegraf } = require('telegraf');
const fs = require('fs');

const creds = fs.readFileSync('.credentials', 'utf8');
const tokenLine = creds.split('\n').find(l => l.includes('Bot Token:'));
const token = tokenLine ? tokenLine.split(': ')[1].trim() : null;

if (!token) {
    console.log('Token not found in credentials');
    process.exit(1);
}

const bot = new Telegraf(token);

async function getMessages() {
    try {
        const updates = await bot.telegram.getUpdates({ limit: 50 });
        const luksoMessages = updates
            .filter(u => u.message?.chat?.id === -1001430401358)
            .slice(-15);
        
        console.log(`Found ${luksoMessages.length} messages in @LUKSO chat:\n`);
        
        for (const u of luksoMessages) {
            const msg = u.message;
            const username = msg.from?.username || msg.from?.first_name || 'Unknown';
            const text = msg.text || '[no text]';
            // Check for UP address pattern (0x followed by 40 hex chars)
            const upMatch = text.match(/0x[a-fA-F0-9]{40}/);
            if (upMatch) {
                console.log(`>> UP FOUND << ${username}: ${upMatch[0]}`);
            } else {
                console.log(`${username}: ${text.substring(0, 80)}`);
            }
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
    process.exit(0);
}

getMessages();
