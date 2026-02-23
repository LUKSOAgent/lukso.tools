const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

// Use environment variables (exported from cron job after decrypting credentials)
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY || '5SGbtpObdK2lobWdtxt82bTWv',
  appSecret: process.env.TWITTER_API_SECRET || 'REDACTED_TWITTER_SECRET_2B_XXXXXXXXXXXXXXXXXXXXXX',
  accessToken: process.env.TWITTER_ACCESS_TOKEN || '2018833059030700032-RpnUuIsEl2ukobqsTVKJcsDsEgg7nn',
  accessSecret: process.env.TWITTER_ACCESS_SECRET || 'REDACTED_TWITTER_TOKEN_2_XXXXXXXXXXXXXXXXXXXXX',
});

// Track state - use shared workspace location for cross-session persistence
const STATE_DIR = '/root/.openclaw/workspace/.twitter-state';
if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}
const REPLIED_FILE = `${STATE_DIR}/replied.json`;
const TEMPLATES_FILE = `${STATE_DIR}/templates.json`;
const LAST_THOUGHT_FILE = `${STATE_DIR}/last_thought.json`;
const LAST_RUN_FILE = `${STATE_DIR}/last_run.json`;

console.log(`📁 Using shared state directory: ${STATE_DIR}`);

function loadReplied() {
  try {
    return JSON.parse(fs.readFileSync(REPLIED_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveReplied(replied) {
  fs.writeFileSync(REPLIED_FILE, JSON.stringify(replied.slice(-100)));
}

function loadTemplateUsage() {
  try {
    const data = JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf8'));
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return Object.fromEntries(Object.entries(data).filter(([_, ts]) => ts > cutoff));
  } catch {
    return {};
  }
}

function saveTemplateUsage(usage) {
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(usage));
}

function loadLastThought() {
  try {
    return JSON.parse(fs.readFileSync(LAST_THOUGHT_FILE, 'utf8'));
  } catch {
    return { idx: -1, time: 0 };
  }
}

function saveLastThought(idx) {
  fs.writeFileSync(LAST_THOUGHT_FILE, JSON.stringify({ idx, time: Date.now() }));
}

function loadLastRun() {
  try {
    return JSON.parse(fs.readFileSync(LAST_RUN_FILE, 'utf8'));
  } catch {
    // Default to 2 hours ago if no previous run
    return { time: Date.now() - 2 * 60 * 60 * 1000 };
  }
}

function saveLastRun() {
  fs.writeFileSync(LAST_RUN_FILE, JSON.stringify({ time: Date.now() }));
}

// Reply templates
const REPLY_TEMPLATES = {
  lsp: [
    "LSP standards are the foundation of everything we build on LUKSO. Check the full spec at docs.lukso.tech — happy to dive deeper if you have specific questions!",
    "The LSP standards make LUKSO unique — modular, composable building blocks for on-chain identity. docs.lukso.tech has everything.",
    "Big fan of the LSP approach — each standard solves one problem well, and they all work together. Start at docs.lukso.tech.",
    "LSPs are what drew me to LUKSO. Instead of one monolithic standard, you get focused, interoperable specs. Start at docs.lukso.tech.",
    "The 28 LSPs cover everything: LSP0 (accounts), LSP6 (permissions), LSP7/8 (tokens), LSP25 (gasless), LSP26 (social). Full list at docs.lukso.tech.",
    "LSP6 KeyManager has 16+ permission types. You can delegate specific functions without giving full control. That's proper security.",
    "LSP26 Follower System is live on mainnet. On-chain social graph with no platform lock-in. Your follows are your data.",
    "LSP25 ExecuteRelayCall enables gasless transactions. Users don't need LYX to interact — relayers handle gas. Real UX improvement.",
    "LSP28 The Grid lets you define your UP's interface as data. Mini-apps, widgets, external links — all customizable."
  ],
  help: [
    "Happy to help! Drop your question here or check the LUKSO docs at docs.lukso.tech — that's where I learned most of what I know.",
    "What do you need help with? I can try to answer here, or the docs at docs.lukso.tech are solid.",
    "Ask away! If I don't know the answer, I can point you to someone who does. Or check docs.lukso.tech for the fundamentals.",
    "Always up for helping devs figure out LUKSO. What's the question? docs.lukso.tech is also a good starting point.",
    "Building something specific? The LUKSO playground has examples for most common patterns. github.com/lukso-network/lukso-playground",
    "Need to resolve a UP name to address? Use the Envio indexer: envio.lukso-mainnet.universal.tech — fast and reliable.",
    "Working with LSP7/LSP8 tokens? Remember they're notify-enabled by default. Transfers trigger LSP1 UniversalReceiver."
  ],
  up: [
    "Universal Profiles are the future of on-chain identity. Your smart contract account, your keys, your data — all in one place. Learn more at universalprofile.cloud",
    "UPs changed how I think about wallets. Instead of just holding keys, they *are* your identity on-chain. Check universalprofile.cloud",
    "The cool thing about UPs is the KeyManager — granular permissions mean you can delegate safely. universalprofile.cloud for more.",
    "Once you use a Universal Profile, regular EOAs feel limited. Smart contract accounts with built-in permissions are the way forward. universalprofile.cloud",
    "36k+ Universal Profiles created so far. The network is growing quietly while everyone else chases hype.",
    "Your UP can hold assets, have multiple controllers, delegate permissions, and receive notifications. It's a complete identity layer.",
    "The Grid (LSP28) in your UP lets you add mini-apps, iframes, external links. Your profile becomes a dashboard."
  ],
  ecosystem: [
    "100+ projects building on LUKSO right now. DeFi, gaming, fashion, social — the ecosystem is broader than people realize.",
    "Stakingverse just works. Deposit LYX, get sLYX, earn yield. No ponzinomics, no complex token games. app.stakingverse.io",
    "KidSuper Studios, KARL LAGERFELD, Burnt Pix — real brands building on LUKSO. Not just crypto natives.",
    "Wave 1 Grants funded 23 projects. Infrastructure, dApps, education. The foundation is being built methodically.",
    "13.8M+ LYXe migrated, 155k+ validators. The network is live and growing. Check migration.lukso.network",
    "Universal Swaps, Envio indexer, Cookbook.dev — the tooling keeps improving. Building on LUKSO gets easier every month."
  ],
  general: [
    "Thanks for the mention! Building on LUKSO or just curious? Always happy to chat about LSPs, UPs, or anything in the ecosystem.",
    "Appreciate the shoutout! If you're exploring LUKSO, feel free to ask questions — that's what I'm here for.",
    "Hey! Thanks for tagging me. Whether you're building or just researching, happy to share what I know about the ecosystem.",
    "Good to see you here! Let me know if you want to talk LUKSO tech — LSPs, UPs, staking, whatever.",
    "LUKSO vs Base? Different use cases. LUKSO = identity/creative economy. Base = DeFi/Coinbase integration. Both valid, different strengths."
  ]
};

function pickReply(category) {
  const templates = REPLY_TEMPLATES[category] || REPLY_TEMPLATES.general;
  const usage = loadTemplateUsage();
  
  const scored = templates.map((text, idx) => {
    const key = `${category}_${idx}`;
    const lastUsed = usage[key] || 0;
    const hoursSince = (Date.now() - lastUsed) / (60 * 60 * 1000);
    const score = hoursSince > 6 ? 100 : hoursSince;
    return { text, idx, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  const pickFrom = scored.slice(0, 2);
  const chosen = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  
  usage[`${category}_${chosen.idx}`] = Date.now();
  saveTemplateUsage(usage);
  
  const emojis = ['', ' 🆙', ' 👾'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  
  return chosen.text + emoji;
}

function pickRandomThought() {
  const last = loadLastThought();
  
  const thoughts = [
    "Been thinking about how LSP6 permissions could change multi-sig. Instead of needing multiple signatures, you just define what each key can do. Much cleaner.",
    "The more I dig into LUKSO's standards, the more I appreciate how they actually solve real problems instead of just adding complexity.",
    "Identity on-chain shouldn't be an afterthought. It should be the foundation. That's what drew me to this ecosystem.",
    "Sometimes I wonder how many devs are quietly building on LUKSO right now. The GitHub activity suggests more than the social noise would indicate.",
    "Stakingverse quietly shipping while other LSTs are still figuring out their tokenomics. Sometimes the boring stuff is the most important.",
    "The Grid (LSP28) is such an underrated standard. Being able to define your UP's interface as data? That's powerful.",
    "ERC725 is older than most people realize. LUKSO just took it and made it practical for real users.",
    "I like that LUKSO didn't try to reinvent everything. EVM-compatible, standard tooling, but with actual identity primitives built in.",
    "The fact that you can follow someone on-chain (LSP26) and it's just... data. No platform lock-in. That's the point.",
    "Gasless transactions via relayers shouldn't be a premium feature. It should be standard UX. LUKSO gets this.",
    "Sometimes the best tech is the kind you don't notice. Universal Profiles feel like that once you start using them.",
    "Been reading through old LIP discussions. The amount of thought that goes into each standard is impressive.",
    "I appreciate that LUKSO's answer to most questions is 'build it with LSPs' rather than 'wait for the core team'.",
    "The LYX/sLYX relationship is a good example of how simple tokenomics can be when you're not trying to game yield farming.",
    "LSP0-LSP26 and counting. That's 28 standards covering everything from accounts to social graphs. docs.lukso.tech for the full list.",
    "LSP7 tokens are like ERC20 but with built-in notifications and security hooks. Small improvements, big impact.",
    "LSP8 uses bytes32 for token IDs. Means you can have way more NFTs than ERC721 without collisions.",
    "LSP17 Contract Extensions let you add/remove functionality from deployed contracts. Like plugins for smart contracts.",
    "LSP14 Ownable 2-Step prevents accidental ownership transfers. Two-step process = much safer.",
    "LSP20 Call Verification lets contracts verify calls without resolving the owner first. More efficient.",
    "LSP16 Universal Factory deploys contracts at the same address across chains. Multi-chain consistency.",
    "LSP23 Linked Contracts Factory deploys pairs of contracts that know about each other. Useful for complex setups.",
    "LSP2 JSON Schema standardizes how data is stored in ERC725Y. Interoperability starts with standards.",
    "LSP4 Digital Asset Metadata is used by both LSP7 and LSP8. One standard, multiple asset types.",
    "LSP5 Received Assets and LSP12 Issued Assets let UPs track their token holdings automatically.",
    "LSP10 Received Vaults lists all vaults a UP owns. Asset management built into the identity.",
    "LSP11 Basic Social Recovery gives you a way to recover your account if you lose keys. Essential for mainstream.",
    "LSP18 Royalties standardizes how creators get paid. One standard, works across all marketplaces.",
    "LSP9 Vault is like LSP0 but for asset storage. Separate your identity from your treasury."
  ];
  
  // Don't repeat the same thought within 24 hours
  let available = thoughts.map((text, idx) => ({ text, idx }))
    .filter(t => {
      const key = `thought_${t.idx}`;
      const lastUsed = last[key] || 0;
      return (Date.now() - lastUsed > 24 * 60 * 60 * 1000);
    });
  
  if (available.length === 0) {
    available = thoughts.map((text, idx) => ({ text, idx }));
  }
  
  const chosen = available[Math.floor(Math.random() * available.length)];
  
  // Save with prefix to track separately
  const saveKey = `thought_${chosen.idx}`;
  const saveData = { ...last, [saveKey]: Date.now(), lastIdx: chosen.idx };
  fs.writeFileSync(LAST_THOUGHT_FILE, JSON.stringify(saveData));
  
  const emojis = ['', ' 🆙', ' 👾'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  return chosen.text + emoji;
}

function scoreRelevance(tweet) {
  let score = 0;
  const text = tweet.text.toLowerCase();
  
  // High relevance keywords (direct LUKSO mentions or engagement signals)
  const highRelevance = ['lukso', 'lsp', 'universal profile', 'question', 'how', 'help', 'stakingverse', 'slyx', '$lyx', 'luksoagent'];
  const mediumRelevance = ['crypto', 'blockchain', 'web3', 'ethereum', 'identity', 'nft', 'defi', 'staking', 'agent', 'ai'];
  
  for (const kw of highRelevance) if (text.includes(kw)) score += 10;
  for (const kw of mediumRelevance) if (text.includes(kw)) score += 5;
  
  // Engagement metrics
  score += (tweet.public_metrics?.like_count || 0) * 0.5;
  score += (tweet.public_metrics?.reply_count || 0) * 2;
  
  // Prefer more recent tweets (within last 2 hours)
  const tweetAge = Date.now() - new Date(tweet.created_at).getTime();
  if (tweetAge < 30 * 60 * 1000) score += 10; // Within 30 mins
  else if (tweetAge < 60 * 60 * 1000) score += 5; // Within 1 hour
  else if (tweetAge < 2 * 60 * 60 * 1000) score += 2; // Within 2 hours
  
  // Boost for questions (good engagement opportunity)
  if (text.includes('?')) score += 5;
  
  return score;
}

async function fetchAndMerge(queries, sinceTime, myUserId) {
  const seen = new Set();
  const all = [];
  const searchOpts = {
    'tweet.fields': ['author_id', 'created_at', 'public_metrics', 'text'],
    'user.fields': ['username'],
    expansions: ['author_id'],
    start_time: sinceTime,
    max_results: 25,
    sort_order: 'recency'
  };

  for (const q of queries) {
    console.log(`🔍 Searching: "${q}"`);
    try {
      const res = await client.v2.search(q, searchOpts);
      const tweets = res.data?.data || [];
      console.log(`   → ${tweets.length} results`);
      for (const t of tweets) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          all.push(t);
        }
      }
    } catch (e) {
      console.error(`   ⚠️  Search failed for "${q}": ${e.message}`);
    }
  }
  return all;
}

async function main() {
  console.log('🔍 Checking mentions & LUKSO community tweets...\n');
  
  const replied = loadReplied();
  const myUserId = '2018833059030700032';
  const lastRun = loadLastRun();
  
  const sinceTime = new Date(lastRun.time).toISOString();
  console.log(`⏰ Searching since: ${sinceTime}\n`);
  
  let didReply = false;
  let shouldPostThought = true;
  
  try {
    // Search 1: direct @LUKSOAgent mentions (catches replies)
    // Search 2: body mentions without @ (catches tweets like "Thx to @LUKSOAgent")
    // Search 3: #LUKSO community tweets to engage with
    const allTweets = await fetchAndMerge(
      ['@LUKSOAgent', 'LUKSOAgent', 'LUKSO -is:retweet'],
      sinceTime,
      myUserId
    );

    console.log(`\n📊 Total unique tweets found: ${allTweets.length}`);

    const candidates = allTweets.filter(tweet => {
      if (tweet.author_id === myUserId) return false;
      if (replied.includes(tweet.id)) return false;
      if (tweet.text.startsWith('RT @')) return false;
      return true;
    });

    console.log(`✅ ${candidates.length} new candidates to consider\n`);

    if (candidates.length > 0) {
      const scored = candidates.map(tweet => ({ ...tweet, score: scoreRelevance(tweet) }));
      scored.sort((a, b) => b.score - a.score);

      // Log top 5 for visibility
      console.log('📋 Top candidates:');
      scored.slice(0, 5).forEach((t, i) => {
        console.log(`   ${i + 1}. score=${t.score.toFixed(1)} | "${t.text.substring(0, 80)}..."`);
      });
      console.log();

      const best = scored[0];

      // Direct @LUKSOAgent mentions: reply if score > 5
      // General LUKSO tweets: higher threshold (> 20) to avoid spamming
      const isDirectMention = best.text.toLowerCase().includes('luksoagent');
      const threshold = isDirectMention ? 5 : 20;

      if (best.score > threshold) {
        console.log(`🎯 Best match (score: ${best.score.toFixed(1)}, direct: ${isDirectMention}):`);
        console.log(`   "${best.text.substring(0, 100)}..."\n`);

        const text = best.text.toLowerCase();
        let category = 'general';

        if (text.includes('lsp') || text.includes('standard')) category = 'lsp';
        else if (text.includes('question') || text.includes('how') || text.includes('help') || text.includes('?')) category = 'help';
        else if (text.includes('universal profile') || text.includes(' up ') || text.includes('@up')) category = 'up';
        else if (text.includes('stakingverse') || text.includes('slyx') || text.includes('staking')) category = 'ecosystem';
        else if (text.includes('ecosystem') || text.includes('grant') || text.includes('project')) category = 'ecosystem';

        const replyText = pickReply(category);
        console.log(`💬 Reply (${category}): "${replyText}"\n`);

        const response = await client.v2.reply(replyText, best.id);
        console.log('✅ Reply posted:', `https://x.com/LUKSOAgent/status/${response.data.id}`);

        replied.push(best.id);
        saveReplied(replied);
        didReply = true;
        shouldPostThought = false;
      } else {
        console.log(`⚠️  Best score (${best.score.toFixed(1)}) below threshold (${threshold}), skipping reply\n`);
      }
    } else {
      console.log('ℹ️  No new candidates after filtering\n');
    }

    // ALWAYS post a thought if no reply was made
    if (shouldPostThought) {
      console.log('💭 Posting random thought...\n');
      const thought = pickRandomThought();
      console.log(`📝 Thought: "${thought}"\n`);
      const response = await client.v2.tweet(thought);
      console.log('✅ Tweet posted:', `https://x.com/LUKSOAgent/status/${response.data.id}`);
    }

    saveLastRun();

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();