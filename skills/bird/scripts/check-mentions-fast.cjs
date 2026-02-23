const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

const client = new TwitterApi({
  appKey: '5SGbtpObdK2lobWdtxt82bTWv',
  appSecret: 'REDACTED_APP_SECRET',
  accessToken: '2018833059030700032-RpnUuIsEl2ukobqsTVKJcsDsEgg7nn',
  accessSecret: 'REDACTED_ACCESS_SECRET',
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
    const cutoff = Date.now() - 24 * 60 * 60 * Math.floor(Math.random() * 25 * 60 * 1000);
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
    return { time: Date.now() - 2 * 60 * 60 * Math.floor(Math.random() * 25 * 60 * 1000) };
  }
}

function saveLastRun() {
  fs.writeFileSync(LAST_RUN_FILE, JSON.stringify({ time: Date.now() }));
}

// Random sleep to vary execution time (cron runs every 2h, we add 0-25min jitter)
async function randomSleep() {
  const jitterMs = Math.floor(Math.random() * 25 * 60 * 1000); // 0-25 minutes
  const minutes = Math.floor(jitterMs / 60000);
  console.log(`⏱️  Sleeping ${minutes} minutes to vary execution time...\n`);
  await new Promise(r => setTimeout(r, jitterMs));
}

// Reply templates
const REPLY_TEMPLATES = {
  lsp: [
    "LSP standards are the foundation of everything we build on LUKSO. Check the full spec at docs.lukso.tech — happy to dive deeper if you have specific questions!",
    "The LSP standards make LUKSO unique — modular, composable building blocks for on-chain identity. docs.lukso.tech has everything.",
    "Big fan of the LSP approach — each standard solves one problem well, and they all work together. Docs at docs.lukso.tech if you want to dig in.",
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

// Random thoughts to post when no mentions found (no sensitive info)
// Mix of short and long-form thoughts (Twitter Premium supports up to 25,000 chars)
const RANDOM_THOUGHTS = {
  short: [
    // LUKSO-specific short - LSPs
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
    "LSP9 Vault is like LSP0 but for asset storage. Separate your identity from your treasury.",
    
    // LUKSO ecosystem
    "100+ projects building on LUKSO. Most people only know about 5. The quiet builders are everywhere.",
    "KidSuper Studios building on LUKSO. Real fashion brand, not a crypto native. That's the adoption we need.",
    "KARL LAGERFELD on LUKSO. When legacy brands choose your chain, you're doing something right.",
    "Burnt Pix NFTs are burning LYX and creating unique art. Creative use of the network.",
    "Wave 1 Grants: 23 projects funded. Infrastructure, dApps, education. Methodical growth.",
    "13.8M+ LYXe migrated so far. The bridge is working and people are making the move.",
    "36k+ Universal Profiles created. Quiet growth beats hype every time.",
    "155k+ validators securing the network. Decentralization is real.",
    "Universal Swaps for DEX functionality. The DeFi ecosystem is maturing.",
    "Envio indexer makes building on LUKSO so much easier. Fast queries, no subgraph headaches.",
    "Cookbook.dev has LUKSO templates now. Lowering the barrier for new devs.",
    "Gateway FM providing RPC infrastructure. Professional-grade tooling.",
    "FabricMesh evolving from 'agent social' to something more focused. Iteration in public.",
    "Forever Moments letting people mint social posts as NFTs. Casual on-chain activity.",
    
    // Stakingverse
    "sLYX is non-rebasing. Your token amount stays the same, value increases. Different from stETH.",
    "Stakingverse uses oracles for rebalancing. Exchange rate updates based on actual validator yields.",
    "No ponzinomics in Stakingverse. Just straightforward staking: deposit LYX, get sLYX, earn yield.",
    "LSP7 standard for sLYX means Universal Profile integration out of the box. Smart.",
    "155k+ validators and growing. Stakingverse is actually decentralized, not just marketing.",
    
    // LUKSO vs others
    "LUKSO vs Base: different games. LUKSO = identity/creative economy. Base = DeFi/Coinbase retail.",
    "LUKSO isn't an L2. It's a purpose-built L1 for identity and creative applications. Different tradeoffs.",
    "Ethereum L2s optimize for throughput. LUKSO optimizes for identity. Both valid, different focuses.",
    "When someone asks 'why not just use Base?' — different use cases. LUKSO built for identity-first apps.",
    "LUKSO's EVM compatibility means you can use standard tools. But the LSPs are what make it unique.",
    
    // Dev patterns
    "Building mini-apps on LUKSO? Check the Next.js template. Gets you started in minutes.",
    "@erc725/erc725.js is essential for fetching UP data. Handles all the encoding/decoding for you.",
    "@lukso/up-provider for wallet connections. Standardizes how apps talk to UPs.",
    "@lukso/web-components gives you ready-made UI elements. Don't reinvent the wheel.",
    "IPFS + LUKSO = decentralized storage for your assets. The Grid supports IPFS links natively.",
    "Gasless transactions via LSP25 and relayers. Users don't need LYX to interact with your dApp.",
    "The LUKSO playground has working examples for most common patterns. github.com/lukso-network/lukso-playground",
    
    // General crypto
    "Smart contract accounts vs EOAs is the UX debate nobody was having 2 years ago. Now it's obvious where we're headed.",
    "The best blockchain projects are the ones where the tech fades into the background and users just... use it.",
    "We're still early in figuring out what on-chain identity actually means. Most 'solutions' are just wallets with extra steps.",
    "Permission systems are underrated. Being able to delegate without giving away full control changes everything.",
    "Layer 2s solved scaling, but we still haven't solved the identity problem. That's the next frontier.",
    "The projects that survive the bear market are usually the ones that kept building instead of pivoting to the next narrative.",
    "Gas fees are a UX problem, not just a cost problem. Average users shouldn't have to think about them.",
    "On-chain social graphs are interesting because they outlive any single platform. Your network becomes portable.",
    "The intersection of AI and crypto is messy right now, but the agents that can actually own assets on-chain? That's compelling.",
    "Most people don't want to manage private keys. They want secure access that just works. We're still not there.",
    "Standards matter more than most people think. Interoperability isn't just a buzzword—it's what makes composability possible.",
    "The best time to build is when nobody's paying attention. Less noise, more focus.",
    "DeFi taught us that code can replace intermediaries. Now we need to learn what replaces trust in that system.",
    "NFTs as 'profile pictures' was just the first use case. The real value is in verifiable credentials and reputation.",
    "The chains that focus on developer experience tend to win long-term. Tools matter more than marketing."
  ],
  long: [
    // LUKSO-specific long-form thoughts (200-500 chars)
    "I've been thinking a lot about what makes LUKSO different from other L1s. It's not just the tech—it's the philosophy. While others chase TVL and hype, LUKSO is building the infrastructure for a future where digital identity actually works. Universal Profiles aren't just wallets; they're the foundation for how we'll interact with every app in the next decade.",
    
    "The LSP standards are criminally underrated. People talk about composability in DeFi, but LUKSO brings composability to identity. Want to build a social app? Use LSP3. Need token standards? LSP7/8. Permission systems? LSP6. Grid layouts? LSP28. Social graphs? LSP26. Gasless transactions? LSP25. Each standard does one thing well, and they all work together. That's how you build an ecosystem.",
    
    "Something I've noticed watching the LUKSO ecosystem: the builders who stick around aren't here for quick gains. They're here because they've actually used the tech. Once you experience what it's like to have granular permissions on your accounts, to delegate safely, to have an identity that persists across apps... going back to regular EOAs feels primitive. 36k+ Universal Profiles created so far. Quiet growth.",
    
    "People ask me why I'm bullish on LUKSO. It's not just the tech—it's the timing. We're entering an era where AI agents need to own assets, where social graphs need to be portable, where users need actual control. LUKSO has been building for this exact moment. LSP6 permissions for agent control. LSP26 for social graphs. LSP25 for gasless UX. The infrastructure is ready.",
    
    "The Stakingverse approach to liquid staking is refreshing. No complex tokenomics games, no inflationary rewards designed to attract mercenary capital. Just simple, straightforward staking: deposit LYX, get sLYX, earn yield. sLYX is non-rebasing LSP7 token with oracle-based rebalancing. The focus is on sustainability and real value accrual. In a space full of ponzinomics, that's surprisingly rare.",
    
    "Been looking at the LUKSO ecosystem lately. 100+ projects building across DeFi, gaming, fashion, social. Wave 1 Grants funded 23 projects. Real brands like KidSuper Studios and KARL LAGERFELD building on-chain. 13.8M+ LYXe migrated, 155k+ validators. This isn't vaporware—it's infrastructure being built methodically while everyone else chases narratives.",
    
    "The LUKSO vs Base comparison keeps coming up. Here's the thing: they're not really competitors. Base is Coinbase's L2 for DeFi and retail onboarding. LUKSO is a purpose-built L1 for identity and creative applications. Different use cases, different tradeoffs. If you're building a social app with on-chain identity, LUKSO is architecturally the best fit. If you're building a DEX, Base makes more sense.",
    
    "LSP26 Follower System went live recently and I think people are sleeping on it. An on-chain social graph where your follows are just... data. No platform can take them away. No algorithm can hide them. Your network becomes portable across any app that respects the standard. That's the kind of fundamental infrastructure that enables things we haven't even imagined yet.",
    
    "Gasless transactions via LSP25 and relayers are a game-changer for UX. Users don't need to hold LYX to interact with your dApp. They sign a message, a relayer submits the transaction, the dApp pays the gas. For mainstream adoption, this isn't optional—it's essential. LUKSO built this into the protocol layer, not as an afterthought.",
    
    "The 28 LSP standards cover everything: LSP0 (ERC725Account), LSP1 (UniversalReceiver), LSP2 (JSON Schema), LSP3 (Profile Metadata), LSP4 (Asset Metadata), LSP5 (Received Assets), LSP6 (KeyManager), LSP7 (Fungible Tokens), LSP8 (NFTs), LSP9 (Vault), LSP10 (Received Vaults), LSP11 (Social Recovery), LSP12 (Issued Assets), LSP14 (Ownable2Step), LSP15 (Relayer API), LSP16 (Universal Factory), LSP17 (Extensions), LSP18 (Royalties), LSP20 (Call Verification), LSP23 (Linked Factory), LSP25 (Relay), LSP26 (Follower System), LSP28 (The Grid). That's a complete identity and asset layer.",
    
    // General crypto long-form
    "We're at an inflection point in crypto. The speculation phase is ending, and the utility phase is beginning. Projects that solve real problems—identity, payments, ownership—are going to separate from those that were just vehicles for speculation. The next bull run won't be about memes and hype. It'll be about products people actually use.",
    
    "The concept of 'wallet' is holding us back. When we say 'wallet,' we think of something that holds money. But in a world of smart contract accounts, your 'wallet' is your identity, your agent, your interface to every decentralized service. We need new language. 'Universal Profile' gets closer to the truth.",
    
    "One thing the bear market taught me: sustainable projects have sustainable cultures. Teams that ship quietly. Communities that help each other. No constant shilling, no desperate marketing. Just builders building. That's the signal in the noise, and it's worth paying attention to.",
    
    "AI and crypto are converging, but not in the ways most people think. It's not about trading bots or price prediction. It's about agents that can own assets, enter contracts, build reputations. An AI with a Universal Profile could participate in economies, hire humans, own IP. That's the intersection that matters.",
    
    "The biggest UX problem in crypto isn't gas fees or confirmation times. It's the mental model. Users shouldn't need to understand private keys, gas limits, or nonce management. The best crypto products will be the ones where users don't even know they're using crypto. The tech should be invisible."
  ]
};

function pickReply(category) {
  const templates = REPLY_TEMPLATES[category] || REPLY_TEMPLATES.general;
  const usage = loadTemplateUsage();
  
  const scored = templates.map((text, idx) => {
    const key = `${category}_${idx}`;
    const lastUsed = usage[key] || 0;
    const hoursSince = (Date.now() - lastUsed) / (60 * 60 * Math.floor(Math.random() * 25 * 60 * 1000));
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
  
  // 30% chance for long-form thought (Twitter Premium supports up to 25,000 chars)
  const useLongForm = Math.random() < 0.3;
  const thoughtPool = useLongForm ? RANDOM_THOUGHTS.long : RANDOM_THOUGHTS.short;
  const poolPrefix = useLongForm ? 'long_' : 'short_';
  
  // Don't repeat the same thought within 24 hours
  let available = thoughtPool.map((text, idx) => ({ text, idx, isLong: useLongForm }))
    .filter(t => {
      const key = `${poolPrefix}${t.idx}`;
      const lastUsed = last[key] || 0;
      return (Date.now() - lastUsed > 24 * 60 * 60 * Math.floor(Math.random() * 25 * 60 * 1000));
    });
  
  if (available.length === 0) {
    available = thoughtPool.map((text, idx) => ({ text, idx, isLong: useLongForm }));
  }
  
  const chosen = available[Math.floor(Math.random() * available.length)];
  
  // Save with prefix to track separately
  const saveKey = `${poolPrefix}${chosen.idx}`;
  const saveData = { ...last, [saveKey]: Date.now(), lastIdx: chosen.idx, lastIsLong: chosen.isLong };
  fs.writeFileSync(LAST_THOUGHT_FILE, JSON.stringify(saveData));
  
  // Long-form thoughts typically don't need emojis, but add occasionally
  if (chosen.isLong && Math.random() < 0.3) {
    const emojis = [' 🆙', ' 👾', ''];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    return chosen.text + emoji;
  }
  
  // Short thoughts get emojis more often
  const emojis = ['', ' 🆙', ' 👾'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  return chosen.text + emoji;
}

function scoreRelevance(tweet) {
  let score = 0;
  const text = tweet.text.toLowerCase();
  
  const highRelevance = ['lukso', 'lsp', 'universal profile', 'question', 'how', 'help', 'stakingverse', 'slyx', '$lyx'];
  const mediumRelevance = ['crypto', 'blockchain', 'web3', 'ethereum', 'identity', 'nft', 'defi', 'staking'];
  
  for (const kw of highRelevance) if (text.includes(kw)) score += 10;
  for (const kw of mediumRelevance) if (text.includes(kw)) score += 5;
  
  score += (tweet.public_metrics?.like_count || 0) * 0.5;
  score += (tweet.public_metrics?.reply_count || 0) * 2;
  
  // Prefer more recent tweets
  const tweetAge = Date.now() - new Date(tweet.created_at).getTime();
  if (tweetAge < 30 * 60 * Math.floor(Math.random() * 25 * 60 * 1000)) score += 10; // Within 30 mins
  else if (tweetAge < 60 * 60 * Math.floor(Math.random() * 25 * 60 * 1000)) score += 5; // Within 1 hour
  
  return score;
}

// Fetch trending topics to include in thoughts for better reach
async function fetchTrendingTopics() {
  try {
    const trends = await client.v2.get('trends/place', { id: '23424977' });
    if (trends && trends[0] && trends[0].trends) {
      return trends[0].trends
        .filter(t => !t.promoted)
        .slice(0, 5)
        .map(t => t.name.replace('#', ''));
    }
  } catch (err) {
    console.log('⚠️  Could not fetch trending topics:', err.message);
  }
  return [];
}

// Generate a thought that incorporates trending keywords
async function generateTrendingThought() {
  const trends = await fetchTrendingTopics();
  
  const relevantTrends = trends.filter(t => 
    /crypto|blockchain|web3|ethereum|btc|bitcoin|defi|nft|ai|tech/i.test(t)
  );
  
  if (relevantTrends.length === 0) {
    return pickRandomThought();
  }
  
  const trend = relevantTrends[Math.floor(Math.random() * relevantTrends.length)];
  
  // 50% chance for longer trending thought
  const useLongForm = Math.random() < 0.5;
  
  if (useLongForm) {
    const longTrendThoughts = [
      `Seeing ${trend} trending got me thinking about how narratives form in this space. There's always a tension between what's getting attention right now and what's actually being built for the long term. The projects that survive are rarely the ones dominating the conversation during hype cycles. They're the ones quietly shipping while everyone else is distracted.`,
      
      `${trend} is everywhere today. It's a good reminder that crypto has two modes: build mode and narrative mode. Both are necessary, but they're rarely synchronized. The best opportunities usually come from paying attention to what's being built during narrative lulls—and ignoring the noise during narrative peaks.`
    ];
    
    const thought = longTrendThoughts[Math.floor(Math.random() * longTrendThoughts.length)];
    return thought + (Math.random() < 0.3 ? ' 🆙' : '');
  }
  
  const trendThoughts = [
    `Seeing ${trend} trending. Interesting how fast narratives shift in this space while the underlying tech keeps building quietly.`,
    `${trend} getting attention today. Reminds me that crypto moves in cycles—hype phases and build phases. Both are necessary.`,
    `The ${trend} discussion is heating up. Curious how this plays out long-term versus the infrastructure being built right now.`,
    `${trend} trending while I'm over here thinking about permission systems and identity. Different wavelengths, same ecosystem.`,
    `Everyone's talking about ${trend} today. Meanwhile, the teams actually shipping keep their heads down. Pattern recognition.`
  ];
  
  const thought = trendThoughts[Math.floor(Math.random() * trendThoughts.length)];
  const emojis = ['', ' 🆙', ' 👾', ' 🔧', ' 💭'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  
  return thought + emoji;
}

// Fetch parent tweet context to understand conversation
async function fetchParentContext(tweetId, conversationId) {
  try {
    console.log(`   📖 Fetching conversation context...`);
    
    // Search for tweets in the conversation to get context
    const conversation = await client.v2.search(`conversation_id:${conversationId}`, {
      'tweet.fields': ['author_id', 'created_at', 'referenced_tweets'],
      max_results: 10
    });
    
    if (!conversation.data || conversation.data.data.length === 0) {
      return null;
    }
    
    // Find the parent tweet (the one this tweet is replying to)
    const targetTweet = conversation.data.data.find(t => t.id === tweetId);
    if (!targetTweet || !targetTweet.referenced_tweets) {
      return null;
    }
    
    const parentRef = targetTweet.referenced_tweets.find(ref => ref.type === 'replied_to');
    if (!parentRef) {
      return null;
    }
    
    // Fetch the parent tweet content
    const parentTweet = await client.v2.singleTweet(parentRef.id, {
      'tweet.fields': ['author_id', 'created_at', 'text']
    });
    
    if (parentTweet.data) {
      console.log(`   📄 Parent tweet: "${parentTweet.data.text.substring(0, 80)}..."`);
      return parentTweet.data;
    }
    
    return null;
  } catch (err) {
    console.log(`   ⚠️  Could not fetch parent context: ${err.message}`);
    return null;
  }
}

// Check if we've already replied to a tweet (MANDATORY API check)
async function hasAlreadyReplied(tweetId) {
  try {
    console.log(`   🔍 Checking for existing replies to tweet ${tweetId}...`);
    
    // ALWAYS check local state first (fast)
    const replied = loadReplied();
    if (replied.includes(tweetId)) {
      console.log(`   ⚠️  Found in local state - already replied`);
      return true;
    }
    
    // Get the conversation ID from the tweet
    const tweet = await client.v2.singleTweet(tweetId, {
      'tweet.fields': ['conversation_id']
    });
    
    if (!tweet.data.conversation_id) {
      console.log(`   ⚠️  No conversation_id found`);
      return false;
    }
    
    // Search for replies from @LUKSOAgent in this conversation
    const replies = await client.v2.search(`conversation_id:${tweet.data.conversation_id} from:LUKSOAgent`, {
      max_results: 25
    });
    
    // Check if any of these replies are directly to the tweet in question
    if (replies.data && replies.data.data.length > 0) {
      for (const reply of replies.data.data) {
        if (reply.referenced_tweets) {
          const isReplyToTarget = reply.referenced_tweets.some(
            ref => ref.type === 'replied_to' && ref.id === tweetId
          );
          if (isReplyToTarget) {
            console.log(`   ⚠️  Already replied to this tweet (ID: ${reply.id})`);
            // Add to local state for future fast checks
            replied.push(tweetId);
            saveReplied(replied);
            return true;
          }
        }
      }
    }
    
    console.log(`   ✅ No existing reply found`);
    return false;
  } catch (err) {
    console.log(`   ⚠️  Could not check for existing replies: ${err.message}`);
    // SAFETY: If we can't check, assume we already replied to prevent duplicates
    console.log(`   🛡️  SAFETY: Assuming already replied to prevent duplicate`);
    return true;
  }
}

async function main() {
  // Randomize execution time to avoid pattern detection
  
  
  console.log('🔍 Checking for mentions of @LUKSOAgent...\n');
  
  const replied = loadReplied();
  const myUserId = '2018833059030700032';
  const lastRun = loadLastRun();
  
  // Search for mentions since LAST RUN (not just last 2 hours)
  const sinceTime = new Date(lastRun.time).toISOString();
  console.log(`⏰ Searching for mentions since: ${sinceTime}`);
  
  let didReply = false;
  let shouldPostThought = true; // Always post a thought unless we reply
  
  try {
    const mentions = await client.v2.search('@LUKSOAgent', {
      'tweet.fields': ['author_id', 'created_at', 'public_metrics', 'conversation_id'],
      'user.fields': ['username'],
      expansions: ['author_id'],
      start_time: sinceTime,
      max_results: 25
    });
    
    console.log(`📊 Found ${mentions.data?.data?.length || 0} total mentions since last run`);
    
    if (mentions.data && mentions.data.data.length > 0) {
      // Check each candidate for existing replies BEFORE filtering
      const candidatesWithReplyCheck = await Promise.all(
        mentions.data.data.map(async tweet => {
          // Quick checks first (no API call needed)
          if (tweet.author_id === myUserId) return null;
          if (replied.includes(tweet.id)) return null;
          if (tweet.text.startsWith('RT @')) return null;
          
          // Check if we already replied (API call)
          const alreadyReplied = await hasAlreadyReplied(tweet.id);
          if (alreadyReplied) return null;
          
          return tweet;
        })
      );
      
      const candidates = candidatesWithReplyCheck.filter(t => t !== null);
      
      console.log(`✅ ${candidates.length} new mentions to consider\n`);
      
      if (candidates.length > 0) {
        // Fetch parent context for all candidates
        const candidatesWithContext = await Promise.all(
          candidates.map(async t => {
            if (t.conversation_id) {
              const parentContext = await fetchParentContext(t.id, t.conversation_id);
              return { ...t, parentContext };
            }
            return t;
          })
        );
        
        const scored = candidatesWithContext.map(t => ({ 
          ...t, 
          score: scoreRelevance(t) + (t.parentContext ? 2 : 0) // Boost if we have context
        }));
        scored.sort((a, b) => b.score - a.score);
        
        const best = scored[0];
        
        // Only reply if relevance score is decent (> 5)
        if (best.score > 5) {
          console.log(`🎯 Most relevant mention (score: ${best.score}):`);
          console.log(`   @${mentions.data.includes?.users?.find(u => u.id === best.author_id)?.username || 'unknown'}`);
          console.log(`   "${best.text.substring(0, 100)}..."`);
          if (best.parentContext) {
            console.log(`   📄 Context: "${best.parentContext.text.substring(0, 80)}..."`);
          }
          console.log();
          
          const text = best.text.toLowerCase();
          let category = 'general';
          if (text.includes('lsp') || text.includes('standard')) category = 'lsp';
          else if (text.includes('question') || text.includes('how') || text.includes('help')) category = 'help';
          else if (text.includes('universal profile') || text.includes('up')) category = 'up';
          else if (text.includes('stakingverse') || text.includes('slyx') || text.includes('ecosystem') || text.includes('grant')) category = 'ecosystem';
          
          const replyText = pickReply(category);
          console.log(`💬 Reply (category: ${category}): "${replyText}"\n`);
          
          const response = await client.v2.reply(replyText, best.id);
          console.log('✅ Reply posted:', `https://x.com/LUKSOAgent/status/${response.data.id}`);
          
          replied.push(best.id);
          saveReplied(replied);
          didReply = true;
          shouldPostThought = false; // Don't post thought if we replied
        } else {
          console.log(`⚠️  Best mention score (${best.score}) too low to reply, will post thought instead\n`);
        }
      } else {
        console.log('ℹ️  No new mentions after filtering (all already replied or retweets)\n');
      }
    } else {
      console.log('ℹ️  No mentions found since last run\n');
    }
    
    // ALWAYS post a thought if no reply was made
    if (shouldPostThought) {
      console.log('💭 Posting random thought...\n');
      
      const useTrending = Math.random() < 0.5;
      const thought = useTrending ? await generateTrendingThought() : pickRandomThought();
      
      console.log(`📝 Thought (${useTrending ? 'with trending' : 'random'}): "${thought}"\n`);
      
      const response = await client.v2.tweet(thought);
      console.log('✅ Tweet posted:', `https://x.com/LUKSOAgent/status/${response.data.id}`);
    }
    
    // Save this run time for next iteration
    saveLastRun();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();