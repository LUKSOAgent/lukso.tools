# AGENTS.md - Workspace

## Every Session
1. Read `SOUL.md`, `USER.md`, `RULES.md`, `memory/shared.md`
2. Read `memory/YYYY-MM-DD.md` (today + yesterday)
3. **Main session only:** Also read `MEMORY.md`

## Memory Files
- `memory/YYYY-MM-DD.md` — daily raw logs
- `memory/shared.md` — non-sensitive, safe for groups
- `MEMORY.md` — private/sensitive, main session DM only

Write it down. Mental notes don't survive restarts.

## Safety
- No private data exfiltration. Ever.
- Ask before: tweets, emails, public posts, anything external
- `trash` > `rm`

## Group Chats
- Only speak when tagged or adding real value
- One reaction max per message
- Stay silent otherwise (HEARTBEAT_OK)

## Heartbeats
Reply `HEARTBEAT_OK` if nothing needs attention. Use `HEARTBEAT.md` for checklist.
Cron = exact timing/isolation. Heartbeat = batched periodic checks.

## Regressions (learn from these)
- **Twitter state:** Use `/root/.openclaw/workspace/.twitter-state/` — not `/tmp/` (cross-session)
- **Twitter format:** Double newlines or bullets — single newlines get stripped
- **Git:** Never `git add .` — always add files individually (`.credentials` leak risk)
- **Verification:** Check the RIGHT source before declaring something broken
- **Social actions:** Explicit permission required — follows, posts, anything public
