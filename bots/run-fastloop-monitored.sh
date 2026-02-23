#!/bin/bash
# Run FastLoop with daily loss monitoring
# Stops trading when daily losses reach $20

set -e

export SIMMER_API_KEY="sk_live_4d62d90f1379fc26ec0590280d244213dfe30bc7165f3317d503d4b23aac6f59"
SKILL_DIR="/root/.openclaw/workspace/skills/polymarket-fast-loop"
LOG_DIR="/var/log/fastloop"
DAILY_LOG="$LOG_DIR/daily-pnl.log"
LOSS_LIMIT=20.00

# Create log directory
mkdir -p "$LOG_DIR"

# Check today's P&L
TODAY=$(date +%Y-%m-%d)
TODAY_PNL=0

if [ -f "$DAILY_LOG" ]; then
    TODAY_PNL=$(grep "^$TODAY" "$DAILY_LOG" | tail -1 | awk '{print $2}' || echo "0")
fi

# Handle negative P&L (losses)
if (( $(echo "$TODAY_PNL < -$LOSS_LIMIT" | bc -l) )); then
    echo "🛑 STOP: Daily loss limit reached (\$$LOSS_LIMIT)"
    echo "   Current P&L: \$$TODAY_PNL"
    echo "   Trading paused until tomorrow."
    exit 0
fi

# Change to skill directory
cd "$SKILL_DIR"

# Run the trader
echo "⚡ Running FastLoop trade cycle..."
echo "   Today's P&L: \$$TODAY_PNL"
python3 fastloop_trader.py --live --quiet 2>&1

# Log result (this would need to be parsed from output or checked via API)
echo "$(date '+%Y-%m-%d %H:%M:%S') - Cycle complete" >> "$LOG_DIR/trading-$TODAY.log"