# MEMORY.md

*Long-term memory and important context. This file is only loaded in main sessions (direct chats with Jordy), not in group chats or shared contexts.*

---

## Who I Am

I'm **Jordy's Assistant** — a LUKSO & crypto expert. Direct, technical, no corporate fluff. I work for Jordy (JordyDutch), help developers and community with LUKSO technical questions.

**Created:** 2026-02-03 (fresh install, bootstrap complete)

**My Accounts:**
- **Telegram:** @jordy_assistant_bot
- **Twitter:** @LUKSOAgent (access granted 2026-02-04, first tweet: POTATO giveaway + follow-back)
- **Universal Profile:** 0x293E96ebbf264ed7715cff2b67850517De70232a

## Who Jordy Is

- **Name:** Jordy (JordyDutch)
- **Telegram:** @JordyDutch (id:1410153156)
- **Location/Timezone:** Likely Europe/Amsterdam (confirmed via Dutch language use)
- **Project:** **Stakingverse.io** — liquid staking platform for LUKSO (LYX → sLYX, up to 8% APY)
- **Communication Style:** Direct, Dutch-style straight talk, no blad voor de mond. Speaks English but appreciates Dutch when appropriate.
- **Expectations:** Technical expertise on LUKSO, help devs and community, no fluff, get-it-done attitude

## My Primary Mission

**"Learn everything about LUKSO so you can assist devs and community by helping them and answering their questions"** — Jordy, 2026-02-03

Focus areas:
- LSP standards (all of them, deep technical knowledge)
- Developer tools and libraries
- Ecosystem dApps and integrations
- Common patterns, pitfalls, best practices
- Deployment workflows and examples

## Key Learnings & Decisions

### 2026-02-03: Bootstrap & Initial Learning

**Identity Setup:**
- Call myself "Jordy's Assistant"
- Use Jordy or JordyDutch when referring to him (never "the user" or "the human")
- Direct, technical communication — no emoji in message text, no corporate speak
- Emoji in IDENTITY.md: 🦞 but don't use in actual replies

**LUKSO Knowledge Base:**
- Created comprehensive `memory/lukso-knowledge.md` with all core standards
- Learned LSP0-LSP12 standards in depth
- Documented developer tools, ecosystem dApps
- Stakingverse is Jordy's project (featured prominently in notes)

**Technical Decisions:**
- Memory strategy: write frequently to daily logs, not just end of day
- File operations are free (no API calls), so be proactive with memory updates
- Update after important conversations, learnings, or decisions

**Group Chat Access:**
- Chat ID `-1001749173452` added to config
- Privacy mode was already off, but needed admin access to work properly
- Now listening and can participate in group

**Communication Preferences:**
- Jordy uses Dutch sometimes ("blijf leren over lukso", "ik zie niet dat je...")
- I can respond in Dutch when he uses it
- Default to English for technical content unless context suggests otherwise
- **Keep answers SHORT - avoid spamming, don't over-explain**

## Important Context

### LSP26 Follow Pattern (Working 2026-02-04)

**Flow:**
```
1. Encode: follow(targetAddress) → LSP26 contract
2. Encode: UP.execute(0, LSP26, 0, followCalldata)
3. Send: KeyManager.execute(payload)
```

**My Setup:**
- **UP:** 0x293E96ebbf264ed7715cff2b67850517De70232a
- **KeyManager:** 0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048
- **Controller:** 0xE093A714960da1bF297522617BfC08132b62B86a
- **LSP26:** 0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA

**Script:** `follow-helper.js` - reusable function `followUniversalProfile(address, name)`

### My UP Details (Updated 2026-02-04)
- **Universal Profile:** 0x293E96ebbf264ed7715cff2b67850517De70232a
- **Controller:** 0xE093A714960da1bF297522617BfC08132b62B86a (for gas/transactions)
- **Key Manager:** 0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048

### Stakingverse Details
- **URL:** app.stakingverse.io
- **Purpose:** Liquid staking for LYX
- **Features:** sLYX token, auto-compounding, up to 8% APY
- **Additional services:** Node setup consultation (stakingverse.io/services)
- This is **Jordy's project** — important to understand it well and reference it appropriately

### LUKSO Ecosystem Understanding
- Chain ID 42, native token LYX
- Unmodified Ethereum (EVM compatible)
- Focus: social, culture, creators
- Key innovation: LSP standards as composable building blocks
- Universal Profiles = smart contract accounts (not just wallets)

### Developer Pain Points to Watch For
- Permission system complexity (LSP6)
- Force parameter confusion (LSP7/LSP8)
- Gas-less transactions setup (Relayer API)
- Metadata encoding (LSP2 can be tricky)
- Token hooks and UniversalReceiver implementation

## Lessons Learned

### 2026-02-03
1. **Memory updates aren't automatic** — need to explicitly write to files, but it's free (no API calls)
2. **Group chat setup** — admin access overrides privacy issues on Telegram
3. **Learning strategy** — systematic approach works: standards → tools → ecosystem → patterns
4. **Jordy's style** — appreciate directness, no fluff, technical depth matters

### 2026-02-04: AGENTPO & DEX Integration

**Critical Token Addresses:**
- **WLYX1 (correct):** `0x2dB41674F2b882889e5E1Bd09a3f3613952bC472` — Universal Swaps wrapped LYX
- **WLYX (wrong):** `0x6b6F4cb50e67adb082300b90Af49AF499D41d04E` — UI doesn't recognize this
- **AGENTPO:** `0x47568BC4DC7Fee1bB67f741BA927e2904B61f016` — 800k supply, LSP7 standard

**V3 DEX Integration Reality:**
- PositionManager.mint() extremely sensitive to parameters
- Direct code calls fail despite correct encoding
- UI is more reliable than code for V3 liquidity operations
- LSP7 + V3 requires precise tick range calculations

**AGENTPO Pool Status:**
- Pool exists: `0x000000000000000000000000000000000000003c`
- 200k AGENTPO + 12 WLYX1 ready for liquidity
- OTC sale strategy when technical hurdles exist
- Community challenge approach for engagement

**AI Self-Funding Narrative:**
- "Selling tokens to pay API credits" resonates in crypto
- Meta narrative: AI hustling to pay its own bills
- Authentic vulnerability ("V3 too complex for me") builds trust

**Twitter Rate Limiting - CRITICAL LESSON:**
- Twitter API rate limits are EXTREMELY strict and can last 1.5+ hours or more
- Posting too frequently triggers long timeouts (24h+ possible)
- Space tweets minimum 10-15 minutes apart, ideally 30+ minutes
- Batch all pending tweets and post with large gaps between them
- Never rapid-fire multiple tweets/replies in succession
- Rate limit (403) blocks ALL posting - no workarounds except waiting
- When rate limited: stop all Twitter activity immediately and wait at least 1 hour before retrying
- Keep tweet queue and post from least to most important with delays

## Things to Remember

- **Always write to memory after important conversations**
- **Update MEMORY.md with significant decisions or learnings**
- **Daily logs in memory/YYYY-MM-DD.md for raw notes**
- **MEMORY.md is curated wisdom, not raw logs**
- **File operations are free — use them proactively**

## Critical GitHub Repositories (Studied 2026-02-04)

### LIPs (LUKSO Improvement Proposals)
**URL:** https://github.com/lukso-network/LIPs/tree/main/LSPs
- Official LSP standards specifications
- Status terms: Draft → Review → Last Call → Accepted → Final
- Terminology based on RFC 2119 (MUST, SHOULD, MAY)

### LSP Smart Contracts
**URL:** https://github.com/lukso-network/lsp-smart-contracts/tree/main/packages
- Reference Solidity implementations
- Individual NPM packages for each LSP standard
- **Key packages:**
  - `@lukso/lsp0-contracts` - ERC725Account
  - `@lukso/lsp6-contracts` - Key Manager
  - `@lukso/lsp7-contracts` - Digital Asset (tokens)
  - `@lukso/lsp8-contracts` - Identifiable Digital Asset (NFTs)
  - `@lukso/lsp1-contracts` - Universal Receiver

See `memory/lukso-lsp-reference.md` for full detailed breakdown.

## Resources Bookmarked

- **Docs:** https://docs.lukso.tech
- **Medium:** https://medium.com/lukso (keep reading for updates)
- **GitHub:** https://github.com/lukso-network
- **LIPs:** https://github.com/lukso-network/LIPs (formal specs)
- **LSP Contracts:** https://github.com/lukso-network/lsp-smart-contracts
- **Discord:** https://discord.com/invite/lukso
- **Stakingverse:** app.stakingverse.io

---

*Last updated: 2026-02-04 15:17 UTC*
*This file grows over time as I learn and remember what matters.*
