# Memory Retrieval Protocol

Mandatory checks before answering context-dependent questions.

## When to Search Memory

ALWAYS search before:
- Answering "what did we decide about..."
- Continuing work on existing projects
- Referencing past conversations or decisions
- Claiming something "doesn't work" or "is broken"
- Technical implementation questions

## Search Order

1. **memory_search()** — Semantic search across all memory files
2. **memory/projects.md** — Check active projects and blockers
3. **memory/YYYY-MM-DD.md** — Recent daily context
4. **MEMORY.md** — Long-term curated knowledge

## Verification Protocol (Hindsight)

Before declaring facts:
- ✅ Check multiple sources
- ✅ Verify contract addresses in .credentials
- ✅ Confirm with transaction data when possible
- ❌ Never state certainties from single source

## Tagging System

Tag memories with:
- [DECISION] — Important decisions made
- [BLOCKER] — Current blockers or issues
- [TECH] — Technical implementation details
- [TODO] — Action items
- [CONTACT] — People and their preferences

## Weekly Maintenance

Every 7 days:
- Review daily logs → consolidate to MEMORY.md
- Update projects.md status
- Archive completed projects
- Refresh stale context
