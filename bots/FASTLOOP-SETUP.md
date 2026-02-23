# Polymarket FastLoop Setup - READY TO USE

## ✅ Status: INSTALLED & CONFIGURED

Skill: `polymarket-fast-loop` v1.0.7
Location: `/root/.openclaw/workspace/skills/polymarket-fast-loop/`

## 🔧 Your Configuration

```json
{
  "entry_threshold": 0.05,      // Trade when price diverges 5¢ from 50¢
  "min_momentum_pct": 0.5,      // Need 0.5% BTC move (higher = fewer trades, better quality)
  "max_position": 10.0,         // $10 per trade (matches your risk limit)
  "daily_budget": 10.0,         // $10 daily max (your circuit breaker)
  "asset": "BTC",
  "window": "5m",
  "volume_confidence": true
}
```

## 🚀 How to Run

### 1. Set API Key (ONE TIME)
```bash
export SIMMER_API_KEY="your-key-from-simmer-dashboard"
```

Get key from: https://simmer.markets/dashboard → SDK tab

### 2. Test (Dry Run - No Real Trades)
```bash
cd /root/.openclaw/workspace/skills/polymarket-fast-loop
python3 fastloop_trader.py
```

### 3. Go Live
```bash
python3 fastloop_trader.py --live
```

### 4. Run on Loop (Every 5 minutes)
```bash
# Add to crontab
crontab -e

# Add this line:
*/5 * * * * cd /root/.openclaw/workspace/skills/polymarket-fast-loop && /usr/bin/python3 fastloop_trader.py --live --quiet >> /var/log/fastloop.log 2>&1
```

Or use OpenClaw heartbeat (add to HEARTBEAT.md).

## 📊 What It Does

1. **Finds active BTC 5-min markets** on Polymarket
2. **Fetches Binance BTC price** (last 5 minutes)
3. **Calculates momentum**: (current - 5min ago) / 5min ago
4. **Compares to market odds**: If BTC up 0.8% but market only $0.52 → buy YES
5. **Executes trade** via Simmer API

## ⚠️ Important Notes

- **10% fee** on Polymarket fast markets (factor into edge!)
- **Dry run is default** — must use `--live` for real trades
- **Tags trades** with `source: sdk:fastloop` for tracking
- **Needs Simmer Pro** for decent frequency (50 trades/day vs 10 free)

## 🛠️ Commands

```bash
# Show config
python3 fastloop_trader.py --config

# Show positions
python3 fastloop_trader.py --positions

# Change settings
python3 fastloop_trader.py --set max_position=15
python3 fastloop_trader.py --set entry_threshold=0.08

# Smart sizing (5% of balance per trade)
python3 fastloop_trader.py --live --smart-sizing
```

## 🔍 Monitoring

Check logs:
```bash
tail -f /var/log/fastloop.log
```

## 🆘 Troubleshooting

**"No active fast markets"** → Markets offline (weekends/nights)

**"Import failed: Rate limit"** → Need Simmer Pro tier

**"No liquidity"** → Position too big, reduce `max_position`

## 💰 Expected Performance

Based on backtests (optimistic):
- 10-20 trades/day
- Win rate: 60-70%
- Edge needed: >5% to beat fees

**⚠️ Reality check**: Most traders lose on fast markets.

## 📝 Next Steps

1. ✅ Get Simmer API key
2. ✅ Test dry run
3. ✅ Paper trade 24h
4. ✅ Go live with $10
5. ✅ Scale after 50+ profitable trades

---

**Config file**: `skills/polymarket-fast-loop/config.json`
**Main script**: `skills/polymarket-fast-loop/fastloop_trader.py`

Ready when you are! 🚀