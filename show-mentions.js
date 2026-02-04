const fs = require('fs');

console.log('📊 Twitter Mentions Tracker');
console.log('===========================\n');

if (!fs.existsSync('/root/.openclaw/workspace/twitter_mentions.jsonl')) {
  console.log('No mentions tracked yet.');
  process.exit(0);
}

const mentions = fs.readFileSync('/root/.openclaw/workspace/twitter_mentions.jsonl', 'utf8')
  .trim()
  .split('\n')
  .filter(line => line)
  .map(line => JSON.parse(line));

console.log(`Total mentions tracked: ${mentions.length}\n`);

// Group by status
const pending = mentions.filter(m => m.replyPending);
const replied = mentions.filter(m => m.replied);

console.log(`Pending replies: ${pending.length}`);
console.log(`Replied: ${replied.length}`);
console.log('');

if (pending.length > 0) {
  console.log('⚠️  PENDING REPLIES:');
  console.log('-------------------');
  pending.forEach((m, i) => {
    console.log(`${i+1}. @${m.author}`);
    console.log(`   Summary: ${m.summary}`);
    console.log(`   Priority: ${m.priority || 'normal'}`);
    console.log(`   Time: ${new Date(m.timestamp).toLocaleString()}`);
    console.log('');
  });
}

// High priority items
const highPriority = mentions.filter(m => m.priority === 'high');
console.log(`\n🚨 HIGH PRIORITY ITEMS: ${highPriority.length}`);
highPriority.forEach((m, i) => {
  console.log(`  ${i+1}. ${m.summary}`);
  if (m.actionNeeded) console.log(`      → Action: ${m.actionNeeded}`);
});