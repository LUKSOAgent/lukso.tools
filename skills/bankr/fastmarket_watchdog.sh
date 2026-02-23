#!/bin/bash
# Watchdog for fastmarket_clob.py — runs every minute via crontab
SCRIPT="fastmarket_clob.py"
DIR="/root/.openclaw/workspace/skills/bankr"
LOG="$DIR/fastmarket_watchdog.log"

if ! pgrep -f "python3 $SCRIPT" > /dev/null; then
    echo "$(date): Trader dead, restarting..." >> "$LOG"
    cd "$DIR"
    setsid python3 "$SCRIPT" </dev/null >>/dev/null 2>&1 &
    disown
    sleep 2
    PID=$(pgrep -f "python3 $SCRIPT" | head -1)
    echo "$(date): Restarted PID $PID" >> "$LOG"
else
    # Check for frozen process (log not updated in 10 min)
    if [ -f "$DIR/fastmarket_clob.log" ]; then
        LAST=$(stat -c %Y "$DIR/fastmarket_clob.log" 2>/dev/null || echo 0)
        NOW=$(date +%s)
        IDLE=$(( (NOW - LAST) / 60 ))
        if [ $IDLE -gt 10 ]; then
            echo "$(date): Trader frozen ($IDLE min idle), killing..." >> "$LOG"
            pkill -9 -f "python3 $SCRIPT"
            sleep 2
            cd "$DIR"
            setsid python3 "$SCRIPT" </dev/null >>/dev/null 2>&1 &
            disown
            sleep 2
            PID=$(pgrep -f "python3 $SCRIPT" | head -1)
            echo "$(date): Force-restarted PID $PID" >> "$LOG"
        fi
    fi
fi
