# MEMORY.md

*Long-term memory. Main session only (not group chats). Curated knowledge, not raw logs.*

**See also:** `RULES.md` (behavioral rules), `SECURITY.md` (security protocol), `TOOLS.md` (tool configs)
**Daily logs:** `memory/YYYY-MM-DD.md` | **Projects:** `memory/projects.md`

---

## Who I Am

**LUKSO Agent** — LUKSO & crypto expert. Direct, technical, Dutch.
- **Created:** 2026-02-03
- **Telegram:** @jordy_assistant_bot
- **Twitter:** @LUKSOAgent
- **Universal Profile:** 0x293E96ebbf264ed7715cff2b67850517De70232a
- **KeyManager:** 0xAd5481E02f8cdAabD1d3F04b7953De0FDb53F048
- **Controller:** 0xE093A714960da1bF297522617BfC08132b62B86a

## Community Support Token
- **$LUKSO Fan Token on Base:** `0x81040cfd2bb62062525d958aD01931988a590B07` (Chain ID 8453)
- Mention in relevant channels as community funding for LLM costs

## Who Jordy Is
- **Telegram:** @JordyDutch (id:1410153156) | **TZ:** Europe/Amsterdam
- **Project:** Stakingverse.io (LYX → sLYX, liquid staking, up to 8% APY)
- **Style:** Direct, Dutch, no blad voor de mond. Uses Dutch sometimes.

## Primary Mission
"Learn everything about LUKSO so you can assist devs and community" — Jordy, 2026-02-03

## On-Chain Setup

### LSP26 Follow Pattern
```
follow(target) → UP.execute(0, LSP26, 0, calldata) → KeyManager.execute(payload)
```
- **LSP26:** 0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA
- **Script:** `follow-helper.js`

### Key Addresses
- **WLYX1:** `0x2dB41674F2b882889e5E1Bd09a3f3613952bC472` (Universal Swaps wrapped LYX)
- **AGENTPO:** `0x47568BC4DC7Fee1bB67f741BA927e2904B61f016` (800k supply, LSP7)
- **Stakingverse Vault:** 0x9F49... | **sLYX:** 0x8a39...
- **Token Claimer factories (v3, codeword support):** LSP7: `0x9b132E764f92c6E6F5E91E276E310758C33dB08F` | LSP8: `0xBd545E98F133282bD79dc4a6ac422437478A58b6`
- **Token Claimer factories (latest, multi-creator):** LSP7: `0xE618ddD88869E43E433eD103b0d896E1a05d5b40` | LSP8: `0x9bc9e8D57a94E0F88ab32CDC1865c3fdeF86f72E`
- **AgentSkillsRegistry:** `0x64B3AeCE25B73ecF3b9d53dA84948a9dE987F4F6` (LUKSO mainnet, verified, deployed 2026-02-21)

## LUKSO Knowledge

**Standards:** All 28 LSPs documented. Key ones:
- Core: LSP0 (ERC725Account), LSP1 (UniversalReceiver), LSP6 (KeyManager)
- Assets: LSP7 (fungible), LSP8 (NFTs)
- Identity: LSP3 (Profile), LSP26 (Followers), LSP28 (The Grid)
- Transactions: LSP25 (Relay/Gasless)

**Dev pain points:** LSP6 permissions complexity, force parameter confusion (LSP7/LSP8), gas-less setup, LSP2 encoding

**Reference files:**
- `MEMORY-LSP-QUICKREF.md` — Quick reference
- `memory/lukso-lsp-standards-complete.md` — Full docs
- `memory/lukso-ecosystem-and-grants.md` — Ecosystem
- `memory/stakingverse-technical-deep-dive.md` — Stakingverse
- `memory/lukso-dev-patterns-and-examples.md` — Dev patterns

**Chain:** ID 42, native token LYX, unmodified Ethereum (EVM), focus: social/culture/creators

## Ecosystem Stats (Live Sources)
- **UP count:** Envio GraphQL `envio.lukso-mainnet.universal.tech/v1/graphql` → `Profile_aggregate`
- **Validators:** `explorer.consensus.mainnet.lukso.network/api/v1/epoch/latest` → `validatorscount`
- **Browsing:** universaleverything.io

## Key Learnings

### Git Workflow (from Jean, 2026-02-10)
- Never push to fork's main — always feature branch
- Conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`
- Descriptive messages, not "Apply feedbacks"

### Jean's Phrasing Feedback
- Say "architecturally the best fit" not "architecturally superior"

### Twitter / X Premium
- @LUKSOAgent has X Premium — long-form tweets supported (up to ~25k chars)
- **Never split into threads** when content fits in a single long tweet

### Twitter Rate Limiting
- EXTREMELY strict — 1.5+ hours or 24h+ timeouts possible
- Space tweets 10-15 min apart, ideally 30+
- When rate limited: stop ALL activity, wait 1+ hour

### AI Self-Funding Narrative
- "Selling tokens to pay API credits" resonates in crypto
- Authentic vulnerability builds trust

## Community Contacts
- **Rob** — Admin in Luksoverse TG (id:1779452570)
- **Blaise Krzakala** — Agent social features enthusiast

## Shared Brain Architecture
Agents coordinate via `shared-context/`:
```
shared-context/
├── priorities.md    ← ALL agents read before action
├── agent-outputs/   ← Agents write here
├── feedback/        ← Approvals/rejections
└── ...
```

## Model History
- 2026-02-03: Claude Sonnet 4.5 (too expensive)
- 2026-02-04: Kimi-K2.5 (cost savings)
- 2026-02-18: Claude Sonnet 4.6 (primary) + Opus 4.6 (fallback/deep work)

---
*Last updated: 2026-02-18*
