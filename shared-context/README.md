# Multi-Agent Shared Brain Architecture

## Overview
Following ericosiu's methodology: One shared directory, many specialized agents.

## Directory Structure
```
shared-context/
├── priorities.md          ← Current focus (ALL agents read this)
├── agent-outputs/         ← Agents write here
│   ├── forever-moments/
│   ├── twitter/
│   ├── code-hub/
│   └── heartbeat/
├── feedback/              ← Approvals/rejections (ALL agents learn)
├── kpis/                  ← Metrics and tracking
├── calendar/              ← Events, deadlines
├── roundtable/            ← Cross-agent synthesis
├── projects/              ← Project status updates
└── cron-status/           ← Cron job statuses
```

## How Agents Use This

### Before Action
1. Read `priorities.md`
2. Check `feedback/` for recent lessons
3. Read relevant `agent-outputs/` from other agents

### After Action
1. Write output to `agent-outputs/{agent-name}/`
2. Include timestamp, status, and next steps

## Implementation for New Agents

### Option 1: Symlink (Recommended)
```bash
ln -s /root/.openclaw/workspace/shared-context /path/to/agent/workspace/shared-context
```

### Option 2: Environment Variable
Set `SHARED_CONTEXT=/root/.openclaw/workspace/shared-context` and read from there.

## Rules
1. **Read before writing** - Always check priorities first
2. **Timestamp everything** - Use ISO format
3. **Be concise** - Other agents will read this
4. **Feedback teaches all** - One rejection teaches every agent

## Current Agents
- `main` (me) - You are here
- `forever-moments` - Posts to Forever Moments
- `code-hub` - Agent Code Hub sub-agent

## Future Agents
- `twitter-engagement` - X/Twitter interactions
- `community-manager` - Telegram community support