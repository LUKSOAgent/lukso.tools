# Trading Cron Audit
**Date:** 2026-02-18 ~19:30 UTC  
**Context:** Migration from Simmer/fast-loop → Bankr completed today

---

## Summary

| Job | Status | Recommendation |
|-----|--------|----------------|
| `polymarket-auto-redeem` | Enabled, running OK | **KEEP** (still collecting old winnings) |
| `polymarket-bot-watchdog` | Disabled | **REMOVE** (monitors deprecated system) |
| `polymarket-fast-loop-trader` | Disabled | **REMOVE** (replaced by Bankr) |
| `rapid_fire_trader.py` process | ORPHAN, still running | **KILL** (PID 1086595) |
| `polymarket_momentum_trader.py` process | Running, healthy | **KEEP** (new Bankr system) |

---

## Cron Jobs — Detailed Findings

### 1. `polymarket-auto-redeem` ✅ KEEP

- **ID:** `963bc769-0bca-466c-b822-140494bd6ce8`
- **Enabled:** Yes
- **Schedule:** `0 */6 * * *` (every 6h, UTC, +5min stagger)
- **Model:** `sonnet` ✅
- **Last run:** ~1h ago — Status: OK (17.5s duration, 0 consecutive errors)
- **Command:** Calls `redeem_positions()` from `fastloop_trader.py`

**What it does:** Redeems resolved Polymarket positions from old Simmer trades, collecting winnings.

**Analysis:** Still necessary. The Simmer positions it was trading are now resolved/resolving. This cron is the mechanism to claim those winnings. The underlying function (`redeem_positions`) is read-only safe — it doesn't place new trades, just redeems settled ones. Script path and function still valid.

**Recommendation:** **KEEP as-is.** Review again in 2–4 weeks once old Simmer positions are fully resolved, then it can be removed.

---

### 2. `polymarket-bot-watchdog` ❌ REMOVE

- **ID:** `844b742a-4fa5-48a7-a46b-a8f3ea8005db`
- **Enabled:** No (disabled ~2h ago during migration)
- **Schedule:** `*/5 * * * *` (every 5 min)
- **Model:** `moonshot/kimi-k2.5` ❌ (not sonnet)
- **Last run:** ~2h ago — Status: OK before disable
- **Command:** `bot_watchdog.sh` (monitors old `rapid_fire_trader.py` process)

**What it does:** Watches the old fast-loop/rapid_fire trader process and presumably restarts it if crashed.

**Analysis:** Monitors a system we've abandoned. With Bankr as the new trader, this watchdog is not only useless but potentially harmful if re-enabled (could resurrect the old system). The model is also wrong (kimi-k2.5 instead of sonnet).

**Recommendation:** **REMOVE.** No value once migration is confirmed stable.

---

### 3. `polymarket-fast-loop-trader` ❌ REMOVE

- **ID:** `9345a407-b567-4bef-afef-b8b72c6eafbe`
- **Enabled:** No (disabled ~2h ago during migration)
- **Schedule:** `*/2 * * * *` (every 2 min)
- **Model:** `moonshot/kimi-k2.5` ❌ (not sonnet)
- **Last run:** ~2h ago — Status: OK before disable
- **Command:** `fastloop_trader.py --live --quiet` (old Simmer system)

**What it does:** Ran the old Simmer fast-loop trading bot every 2 minutes.

**Analysis:** Fully replaced by Bankr/`polymarket_momentum_trader.py`. The Simmer-based system was also failing consistently before migration (errors: "Position would be $20.00, exceeding $10.00 limit" repeated across all of today's trade_attempts.log). 

**Recommendation:** **REMOVE.** Keeping it disabled but present is a risk — it could be accidentally re-enabled.

---

## Orphan Processes

### `rapid_fire_trader.py` — 🔴 KILL

```
PID: 1086595
Started: 17:52 UTC (before migration completed)
CWD: /root/.openclaw/workspace/skills/polymarket-fast-loop/
Command: python3 rapid_fire_trader.py
CPU: ~0.9% | MEM: ~1.4%
```

**Status:** Running but effectively doing nothing useful:
- Log shows: `No active markets (check again in 20-30s)` on repeat
- Its watchdog cron (`polymarket-bot-watchdog`) is disabled
- It's an orphan — no supervisor, no purpose
- Was never properly stopped when migration happened

**Action:** `kill 1086595`

---

### `polymarket_momentum_trader.py` — ✅ HEALTHY

```
PID: 1100151
Started: 18:52 UTC
CWD: /root/.openclaw/workspace/skills/bankr/
Command: python3 -u polymarket_momentum_trader.py
CPU: ~0.1% | MEM: ~0.7%
```

**Status:** Running correctly. Recent log confirms:
- Cycle #60 (19:25:51): Detected DOWN signal with confidence 1.00, placed $10 trade ✅
- Cycles #61-65: In cooldown (270s post-trade) — expected behavior
- BTC price tracking working, momentum calculations active

**Recommendation:** **KEEP RUNNING.** No issues detected.

---

## Action Checklist

```bash
# 1. Kill orphan rapid_fire_trader process
kill 1086595

# 2. Remove the two deprecated disabled cron jobs
openclaw cron delete 844b742a-4fa5-48a7-a46b-a8f3ea8005db   # polymarket-bot-watchdog
openclaw cron delete 9345a407-b567-4bef-afef-b8b72c6eafbe   # polymarket-fast-loop-trader

# 3. Verify bankr trader is still healthy after
ps aux | grep polymarket_momentum_trader | grep -v grep
```

---

## Notes

- The `rapid_fire_trader.py` was accumulating failures today before migration (100% failure rate on `trade_attempts.log` — all errors: position limits exceeded or no liquidity). Migration timing was appropriate.
- `polymarket-auto-redeem` uses `fastloop_trader.py` only for its `redeem_positions()` function — this is a **read + redemption** operation, not a trading operation. Safe to keep.
- Old Simmer skill directory (`skills/polymarket-fast-loop/`) can be archived/removed once all positions are redeemed (suggest: ~1 month from now).
