#!/bin/bash
# Polymarket FastLoop Trading - Production Setup
# Run this script to start live trading with full monitoring

set -e

echo "🚀 Starting Polymarket FastLoop Trading..."
echo "=============================================="

# Configuration
export SIMMER_API_KEY="sk_live_4d62d90f1379fc26ec0590280d244213dfe30bc7165f3317d503d4b23aac6f59"
SKILL_DIR="/root/.openclaw/workspace/skills/polymarket-fast-loop"
LOG_DIR="/var/log/fastloop"
LOG_FILE="$LOG_DIR/trading-$(date +%Y-%m-%d).log"

# Create log directory
mkdir -p "$LOG_DIR"

# Log header
echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting FastLoop trading" >> "$LOG_FILE"

# Check if already running
if pgrep -f "fastloop_trader.py --live" > /dev/null; then
    echo "⚠️  FastLoop already running! Skipping..."
    echo "$(date) - Already running, skipped" >> "$LOG_FILE"
    exit 0
fi

# Change to skill directory
cd "$SKILL_DIR"

# Run the trader (live mode, quiet except trades/errors)
echo "⚡ Executing trade cycle..."
python3 fastloop_trader.py --live --quiet 2>&1 | tee -a "$LOG_FILE"

# Check for errors in output
if [ $? -ne 0 ]; then
    echo "❌ Error occurred! Check logs at $LOG_FILE"
    echo "$(date) - ERROR: Non-zero exit code" >> "$LOG_FILE"
    exit 1
fi

echo "✅ Cycle complete. Next check in 5 minutes."
echo "$(date) - Cycle complete" >> "$LOG_FILE"