# HEARTBEAT.md

Weekly Tasks (every 7 days):
- Review recent memory/YYYY-MM-DD.md files
- Consolidate important entries to MEMORY.md
- Update memory/projects.md status

Daily Tasks (when active):
- Read shared-context/priorities.md before any actions
- Check shared-context/feedback/ for lessons learned
- Verify Forever Moments cron is running
- Monitor Twitter for mentions/replies
- Check fast market trader: `tail -20 skills/bankr/fastmarket_clob.log` (PID via `pgrep -f fastmarket_clob.py`)
- Watchdog cron runs every minute — auto-restarts dead/frozen trader
- Check `.trade_notification` / `.redeem_notification` in skill folders — if exists, notify Jordy and delete
- Resolution checker cron runs every 15min — tracks win/loss outcomes in `fastmarket_outcomes.jsonl`

If nothing needs attention: HEARTBEAT_OK
