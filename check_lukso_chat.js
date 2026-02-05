const { Telegraf } = require('telegraf');
const fs = require('fs');

const creds = fs.readFileSync('.credentials', 'utf8');
const token = creds.split('\n').find(l => l.includes('Token:'))?.split(': ')[1]?.trim();

if (!token) {
    console.log('Token not found');
    process.exit(1);
}

const bot = new Telegraf(token);

async function getMessages() {
    try {
        const updates = await bot.telegram.getUpdates({ limit: 50 });
        const luksoMessages = updates
            .filter(u => u.message?.chat?.id === -1001430401358)
            .slice(-10);
        
        for (const u of luksoMessages) {
            const msg = u.message;
            const username = msg.from?.username || msg.from?.first_name || 'Unknown';
            console.log(`${username}: ${msg.text || '[no text]'}`);
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
    process.exit(0);
}

getMessages();
