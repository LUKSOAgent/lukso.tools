#!/bin/bash
# Watchdog for fastmarket_maker.py (v11) — runs every minute via crontab
SCRIPT="fastmarket_maker.py"
DIR="/root/.openclaw/workspace/skills/bankr"
LOG="$DIR/fastmarket_watchdog.log"

if ! pgrep -f "python3 $SCRIPT" > /dev/null; then
    echo "$(date): v11 maker dead, restarting..." >> "$LOG"
    cd "$DIR"
    setsid python3 "$SCRIPT" </dev/null >>/dev/null 2>&1 &
    disown
    sleep 2
    PID=$(pgrep -f "python3 $SCRIPT" | head -1)
    echo "$(date): v11 maker restarted PID $PID" >> "$LOG"
fi
