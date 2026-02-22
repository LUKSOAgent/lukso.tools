#!/usr/bin/env node
/**
 * Reply Hunter v2 - Pain-point based search for threads where LUKSO genuinely helps.
 * Uses query rotation: HIGH (every run), MEDIUM (every 2nd), LOW (every 4th).
 *
 * Usage:
 *   node reply-hunter.cjs [--dry-run]
 *
 * Environment variables (all required unless --dry-run):
 *   TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET, TWITTER_BEARER_TOKEN
 */

const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

const STATE_DIR = '/root/.openclaw/workspace/.twitter-state';
const REPLIED_FILE = path.join(STATE_DIR, 'replied-threads.json');
const RUN_COUNT_FILE = path.join(STATE_DIR, 'reply-hunter-run-count.json');
const TOPIC_HISTORY_FILE = path.join(STATE_DIR, 'reply-hunter-topic-history.json');
const DRY_RUN = process.argv.includes('--dry-run');
const MAX_REPLIES_PER_RUN = 2;
const MIN_LIKES = 2;
const MIN_REPLIES = 1;
const OWN_USER_ID = '2018833059030700032';

// LSP6-related categories — enforce cooldown so we don't post LSP6 every single run
const LSP6_CATEGORIES = new Set(['ai_agent_keys', 'key_recovery', 'permission_delegation']);

function loadTopicHistory() {
  try {
    return JSON.parse(fs.readFileSync(TOPIC_HISTORY_FILE, 'utf8'));
  } catch {
    return { recent: [] }; // last N pain categories used
  }
}

function saveTopicHistory(history) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(TOPIC_HISTORY_FILE, JSON.stringify(history));
}

// === QUERY TIERS ===
// HIGH: always included — rotated randomly each run for diversity
const HIGH_QUERIES = [
  // AI agent wallet/key pain (LSP6)
  '("AI agent" OR "autonomous agent") ("private key" OR "wallet" OR "key management") -is:retweet -from:LUKSOAgent lang:en',
  // AI agent permissions / delegation (LSP6)
  '("AI agent" OR "LLM agent") ("permissions" OR "delegate" OR "approve") (wallet OR onchain OR "on-chain") -is:retweet -from:LUKSOAgent lang:en',
  // On-chain identity / web3 profile (LSP3)
  '("on-chain identity" OR "onchain identity" OR "web3 identity" OR "web3 profile") -is:retweet -from:LUKSOAgent lang:en',
  // NFT metadata frozen / off-chain (LSP8)
  '("NFT metadata" OR "token metadata") ("off-chain" OR "offchain" OR "frozen" OR "update" OR "dynamic") -is:retweet -from:LUKSOAgent lang:en',
  // Key rotation / lost keys (LSP6)
  '("lost my keys" OR "lost seed phrase" OR "key rotation" OR "rotate keys") (wallet OR crypto OR web3) -is:retweet -from:LUKSOAgent lang:en',
  // Gas UX / gasless / onboarding (LSP25)
  '("gasless" OR "gas fees" OR "pay gas") ("onboarding" OR "UX" OR "users" OR "frustrating") -is:retweet -from:LUKSOAgent lang:en',
];

// MEDIUM: run every 2nd invocation (ERC-4337, smart wallets, gas UX)
const MEDIUM_QUERIES = [
  // ERC-4337 / account abstraction frustration
  '("ERC-4337" OR "ERC4337" OR "account abstraction") ("complex" OR "complicated" OR "painful" OR "broken" OR "frustrated" OR "hard") -is:retweet -from:LUKSOAgent lang:en',
  // Smart wallet setup pain
  '("smart wallet" OR "smart account") ("setup" OR "deploy" OR "factory" OR "bundler" OR "paymaster") -is:retweet -from:LUKSOAgent lang:en',
  // Gas UX complaints
  '("gas fees" OR "gas cost" OR "pay gas" OR "gasless") ("UX" OR "onboarding" OR "users" OR "frustrating") -is:retweet -from:LUKSOAgent lang:en',
  // EOA limitations
  '("EOA" OR "externally owned") ("limited" OR "upgrade" OR "migrate" OR "stuck" OR "can\'t") -is:retweet -from:LUKSOAgent lang:en',
];

// LOW: run every 4th invocation (identity, NFT metadata, ENS)
const LOW_QUERIES = [
  // On-chain identity / profile portability
  '("on-chain identity" OR "onchain identity" OR "web3 identity" OR "decentralized identity") -is:retweet -from:LUKSOAgent lang:en',
  // NFT metadata off-chain / frozen
  '("NFT metadata" OR "token metadata") ("off-chain" OR "offchain" OR "IPFS" OR "frozen" OR "update" OR "dynamic") -is:retweet -from:LUKSOAgent lang:en',
  // Web3 login / auth pain
  '("web3 login" OR "wallet login" OR "sign in with ethereum" OR "SIWE") ("broken" OR "UX" OR "problem" OR "annoying") -is:retweet -from:LUKSOAgent lang:en',
  // ENS limitations / profile standards
  '("ENS" OR "web3 profile") ("limited" OR "missing" OR "wish" OR "need" OR "standard") -is:retweet -from:LUKSOAgent lang:en',
  // Permission delegation
  '("wallet permissions" OR "token approval" OR "approve" OR "allowance") ("dangerous" OR "risk" OR "hack" OR "drain" OR "revoke") -is:retweet -from:LUKSOAgent lang:en',
];

// Pain→Solution mapping (exported as metadata for cron agent)
const PAIN_SOLUTION_MAP = {
  'ai_agent_keys': { pain: 'AI agent key management', solution: 'LSP6 KeyManager — grant agent a controller key with granular per-action permissions, revoke anytime without changing the account', lsp: 'LSP6' },
  'key_recovery': { pain: 'Lost keys / seed phrase', solution: 'LSP6 KeyManager — add multiple controllers to a Universal Profile, rotate compromised keys without losing your identity or assets', lsp: 'LSP6' },
  'erc4337_complexity': { pain: 'ERC-4337 / AA complexity', solution: 'Universal Profiles are smart accounts by default — no bundler, no paymaster setup, no EntryPoint contract. Every account is a smart contract from day one', lsp: 'LSP0' },
  'gas_ux': { pain: 'Gas UX / onboarding friction', solution: 'LSP25 Execute Relay Call — users sign a message, relayer pays gas. Built into the standard, no separate paymaster infra', lsp: 'LSP25' },
  'nft_metadata': { pain: 'NFT metadata frozen / off-chain', solution: 'LSP8 stores metadata on-chain via ERC725Y — updateable, no IPFS dependency, universal receiver hooks for reactive NFTs', lsp: 'LSP8' },
  'smart_wallet_setup': { pain: 'Smart wallet factory/deployment pain', solution: 'On LUKSO every new account IS a Universal Profile (smart contract). No factory juggling, no proxy patterns to manage yourself', lsp: 'LSP0' },
  'onchain_identity': { pain: 'No on-chain profile standard', solution: 'LSP3 Profile Metadata — name, bio, avatar, links stored on the account itself. Portable across any dApp reading the standard', lsp: 'LSP3' },
  'eoa_limitations': { pain: 'EOA limitations', solution: 'Universal Profiles replace EOAs with smart contract accounts. Upgradeable, permissioned, with on-chain metadata. Every user gets contract-level power', lsp: 'LSP0' },
  'permission_delegation': { pain: 'Dangerous token approvals / permissions', solution: 'LSP6 KeyManager — granular permissions per controller: allowed calls, allowed addresses, value limits. No unlimited approvals needed', lsp: 'LSP6' },
  'web3_login': { pain: 'Web3 login/auth UX', solution: 'Universal Profiles with LSP3 metadata — your profile travels with your account. No separate ENS + avatar + bio setup per platform', lsp: 'LSP3' },
};

function loadReplied() {
  try {
    return JSON.parse(fs.readFileSync(REPLIED_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveReplied(data) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(REPLIED_FILE, JSON.stringify(data));
}

function getRunCount() {
  try {
    const data = JSON.parse(fs.readFileSync(RUN_COUNT_FILE, 'utf8'));
    return data.count || 0;
  } catch {
    return 0;
  }
}

function incrementRunCount(count) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(RUN_COUNT_FILE, JSON.stringify({ count: count + 1, lastRun: new Date().toISOString() }));
}

function pickQueries(runCount) {
  // 1 random HIGH per run — pool now covers LSP3/LSP6/LSP8/LSP25 so it rotates naturally
  const shuffledHigh = [...HIGH_QUERIES].sort(() => Math.random() - 0.5);
  const selected = [shuffledHigh[0]];

  // Always 1 random MEDIUM (ERC-4337, smart wallets, gas UX, EOA limits)
  const shuffledMed = [...MEDIUM_QUERIES].sort(() => Math.random() - 0.5);
  selected.push(shuffledMed[0]);

  // Every 2nd run: also 1 LOW (identity, NFT metadata, web3 login, ENS)
  if (runCount % 2 === 0) {
    const shuffledLow = [...LOW_QUERIES].sort(() => Math.random() - 0.5);
    selected.push(shuffledLow[0]);
  }

  return selected;
}

function classifyTweet(text) {
  // Classify a tweet into a pain category for solution matching
  const t = text.toLowerCase();
  if (/(ai agent|llm agent|autonomous agent).*(key|wallet|permission|delegat)/.test(t) ||
      /(key|wallet|permission).*(ai agent|llm agent|autonomous)/.test(t)) return 'ai_agent_keys';
  if (/(lost|lose|recovery|rotate|compromised).*(key|seed|phrase|wallet)/.test(t) ||
      /(key|seed|phrase).*(lost|lose|recovery|rotate|compromised)/.test(t)) return 'key_recovery';
  if (/erc.?4337|account abstraction|bundler|entrypoint|paymaster/.test(t) && /(complex|hard|painful|frustrat|broken|confus)/.test(t)) return 'erc4337_complexity';
  if (/(gas fee|gas cost|gasless|pay gas)/.test(t)) return 'gas_ux';
  if (/(nft|token) metadata/.test(t) && /(off.?chain|ipfs|frozen|updat|dynamic|stuck)/.test(t)) return 'nft_metadata';
  if (/(smart wallet|smart account).*(setup|deploy|factory|bundler)/.test(t)) return 'smart_wallet_setup';
  if (/(on.?chain identity|web3 identity|decentralized identity|web3 profile)/.test(t)) return 'onchain_identity';
  if (/\beoa\b|externally owned/.test(t) && /(limit|stuck|upgrade|migrat|can't)/.test(t)) return 'eoa_limitations';
  if (/(approv|allowance|permission).*(danger|risk|hack|drain|revoke|unlimited)/.test(t) ||
      /(danger|risk|hack|drain).*(approv|allowance|permission)/.test(t)) return 'permission_delegation';
  if (/(web3 login|wallet login|siwe|sign in with ethereum)/.test(t)) return 'web3_login';
  if (/erc.?4337|account abstraction/.test(t)) return 'erc4337_complexity';
  if (/(smart wallet|smart account)/.test(t)) return 'smart_wallet_setup';
  if (/(ai agent|llm agent|autonomous agent)/.test(t)) return 'ai_agent_keys';
  return null;
}

async function searchTweets(bearerClient, query) {
  try {
    const startTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const result = await bearerClient.v2.search(query, {
      max_results: 15,
      'tweet.fields': 'public_metrics,author_id,created_at,conversation_id,in_reply_to_user_id',
      'user.fields': 'username,name,public_metrics',
      expansions: 'author_id',
      sort_order: 'relevancy',
      start_time: startTime,
    });
    return result;
  } catch (e) {
    console.error(`Search failed for "${query.substring(0, 50)}...":`, e.message);
    return null;
  }
}

function filterTweets(tweets, users, replied) {
  const tweetArray = Array.isArray(tweets.data) ? tweets.data : (tweets.data?.data || tweets._realData?.data || []);
  if (!tweetArray.length) return [];

  const userMap = {};
  const userArray = users || tweets._realData?.includes?.users || tweets.includes?.users || [];
  if (userArray) {
    for (const u of userArray) userMap[u.id] = u;
  }

  return tweetArray.filter(t => {
    if (replied[t.id] || replied[t.conversation_id]) return false;
    if (t.author_id === OWN_USER_ID) return false;
    const m = t.public_metrics || {};
    if ((m.like_count || 0) < MIN_LIKES && (m.reply_count || 0) < MIN_REPLIES) return false;
    const age = Date.now() - new Date(t.created_at).getTime();
    if (age > 2 * 60 * 60 * 1000) return false;
    return true;
  }).map(t => {
    const painCategory = classifyTweet(t.text);
    const solutionInfo = painCategory ? PAIN_SOLUTION_MAP[painCategory] : null;
    return {
      ...t,
      author: userMap[t.author_id] || { username: 'unknown' },
      score: (t.public_metrics?.like_count || 0) + (t.public_metrics?.reply_count || 0) * 2,
      painCategory,
      solutionInfo,
    };
  }).sort((a, b) => b.score - a.score);
}

async function main() {
  const runCount = getRunCount();
  console.log(`[Reply Hunter v2] ${new Date().toISOString()} | DRY_RUN=${DRY_RUN} | run=#${runCount}`);

  const replied = loadReplied();
  console.log(`[Reply Hunter v2] ${Object.keys(replied).length} previously replied threads`);

  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    console.error('TWITTER_BEARER_TOKEN required');
    process.exit(1);
  }
  const bearerClient = new TwitterApi(bearerToken);

  const queries = pickQueries(runCount);
  const tierLabels = queries.map((q, i) => i < 2 ? 'HIGH' : (i === 2 && runCount % 4 !== 0 ? 'MED' : (i === 2 ? 'MED' : 'LOW')));
  console.log(`[Reply Hunter v2] ${queries.length} queries this run (tiers: ${tierLabels.join(', ')})`);

  let candidates = [];
  for (const q of queries) {
    const result = await searchTweets(bearerClient, q);
    if (result) {
      const users = result.includes?.users || [];
      const filtered = filterTweets(result, users, replied);
      candidates.push(...filtered);
      const rawCount = Array.isArray(result.data) ? result.data.length : (result._realData?.data?.length || 0);
      console.log(`[Reply Hunter v2] Query "${q.substring(0, 50)}...": ${rawCount} raw, ${filtered.length} candidates`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  // Deduplicate by conversation_id
  const seen = new Set();
  candidates = candidates.filter(c => {
    const key = c.conversation_id || c.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Load topic history to apply cooldown
  const topicHistory = loadTopicHistory();
  const recentCategories = topicHistory.recent || [];
  const lastRunWasLSP6 = recentCategories.slice(-2).some(c => LSP6_CATEGORIES.has(c));

  // Prefer candidates with a matched pain category
  // If last run(s) were LSP6-heavy, penalise LSP6 candidates this run
  candidates.sort((a, b) => {
    const aHasPain = a.painCategory ? 1 : 0;
    const bHasPain = b.painCategory ? 1 : 0;
    if (bHasPain !== aHasPain) return bHasPain - aHasPain;
    // Apply cooldown penalty to LSP6 if recently overused
    let aScore = a.score;
    let bScore = b.score;
    if (lastRunWasLSP6) {
      if (LSP6_CATEGORIES.has(a.painCategory)) aScore -= 100;
      if (LSP6_CATEGORIES.has(b.painCategory)) bScore -= 100;
    }
    return bScore - aScore;
  });

  // Enforce max 1 LSP6 reply per run regardless of score
  let lsp6Count = 0;
  candidates = candidates.filter(c => {
    if (LSP6_CATEGORIES.has(c.painCategory)) {
      if (lsp6Count >= 1) return false;
      lsp6Count++;
    }
    return true;
  });

  candidates = candidates.slice(0, MAX_REPLIES_PER_RUN);

  if (candidates.length === 0) {
    console.log('[Reply Hunter v2] No suitable candidates found this run.');
    console.log('REPLY_HUNTER_RESULT:' + JSON.stringify({ candidates: [], action: 'none', runCount }));
    incrementRunCount(runCount);
    return;
  }

  console.log(`[Reply Hunter v2] Top ${candidates.length} candidates:`);
  for (const c of candidates) {
    console.log(`  - @${c.author.username} [${c.painCategory || 'unclassified'}]: "${c.text.substring(0, 80)}..." (❤️${c.public_metrics?.like_count} 💬${c.public_metrics?.reply_count})`);
  }

  console.log('REPLY_HUNTER_RESULT:' + JSON.stringify({
    candidates: candidates.map(c => ({
      tweetId: c.id,
      conversationId: c.conversation_id,
      authorUsername: c.author.username,
      authorName: c.author.name,
      text: c.text,
      likes: c.public_metrics?.like_count || 0,
      replies: c.public_metrics?.reply_count || 0,
      score: c.score,
      url: `https://x.com/${c.author.username}/status/${c.id}`,
      painCategory: c.painCategory,
      suggestedSolution: c.solutionInfo ? c.solutionInfo.solution : null,
      suggestedLSP: c.solutionInfo ? c.solutionInfo.lsp : null,
    })),
    action: DRY_RUN ? 'dry-run' : 'reply',
    runCount,
    painSolutionMap: PAIN_SOLUTION_MAP,
  }));

  incrementRunCount(runCount);

  // Save topic history for cooldown tracking
  const usedCategories = candidates.map(c => c.painCategory).filter(Boolean);
  if (usedCategories.length > 0) {
    topicHistory.recent = [...recentCategories, ...usedCategories].slice(-8); // keep last 8
    saveTopicHistory(topicHistory);
    console.log(`[Reply Hunter v2] Topic history updated: [${topicHistory.recent.join(', ')}]`);
  }

  if (DRY_RUN) {
    console.log('[Reply Hunter v2] Dry run complete - no replies posted.');
    return;
  }

  console.log('[Reply Hunter v2] Candidates output for cron agent to generate and post replies.');
}

main().catch(e => {
  console.error('[Reply Hunter v2] Fatal:', e.message);
  process.exit(1);
});
