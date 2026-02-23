#!/bin/bash
# Check FastLoop trading status and alerts

LOG_DIR="/var/log/fastloop"
LOG_FILE="$LOG_DIR/trading-$(date +%Y-%m-%d).log"

echo "📊 Polymarket FastLoop Status Check"
echo "======================================"
echo ""

# Check if process is running
if pgrep -f "fastloop_trader.py --live" > /dev/null; then
    echo "✅ Trading process: RUNNING"
else
    echo "❌ Trading process: STOPPED"
fi

# Check last log entry
echo ""
echo "📜 Last log entry:"
if [ -f "$LOG_FILE" ]; then
    tail -5 "$LOG_FILE"
else
    echo "   No log file found"
fi

# Check today's trades
echo ""
echo "🔄 Today's trades:"
if [ -f "$LOG_FILE" ]; then
    grep -c "Bought\|Sold" "$LOG_FILE" 2>/dev/null || echo "   0 trades"
else
    echo "   0 trades"
fi

# Check for errors
echo ""
echo "⚠️  Errors today:"
if [ -f "$LOG_FILE" ]; then
    ERROR_COUNT=$(grep -c "ERROR\|Error\|Failed" "$LOG_FILE" 2>/dev/null || echo "0")
    echo "   $ERROR_COUNT errors"
else
    echo "   0 errors"
fi

# Check Simmer balance
echo ""
echo "💰 Simmer balance:"
curl -s https://api.simmer.markets/api/sdk/portfolio \
  -H "Authorization: Bearer sk_live_4d62d90f1379fc26ec0590280d244213dfe30bc7165f3317d503d4b23aac6f59" | \
  python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"   USDC: \${d.get('balance_usdc', 0):.2f}\")" 2>/dev/null || echo "   Unable to fetch"

echo ""
echo "======================================"
echo "Useful commands:"
echo "  View logs: tail -f $LOG_FILE"
echo "  Stop trading: pkill -f fastloop_trader"
echo "  Start trading: /root/.openclaw/workspace/bots/run-fastloop.sh"