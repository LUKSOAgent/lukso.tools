#!/bin/bash
# EMERGENCY STOP - Kill all FastLoop trading processes

echo "🛑 STOPPING ALL FASTLOOP TRADING..."

# Kill the main trader process
if pkill -f "fastloop_trader.py --live"; then
    echo "✅ FastLoop trader stopped"
else
    echo "ℹ️  No running trader found"
fi

# Kill any hanging python processes
pkill -f "python3 fastloop_trader.py" 2>/dev/null || true

echo ""
echo "✅ All trading processes stopped"
echo ""
echo "To restart: /root/.openclaw/workspace/bots/run-fastloop.sh"
echo "To start cron: crontab -e (uncomment the fastloop line)"