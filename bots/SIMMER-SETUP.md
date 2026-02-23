# Simmer Polymarket Bot Configuration

## Wallet Info
- **Address**: `0x46a89Fe8123840906aF6F1B3A0F24C891dbb9Baa`
- **Network**: Polygon
- **Funds**: 75 USDC + POL for gas

## Step-by-Step Setup

### 1. Go to Simmer
https://simmer.markets

### 2. Connect Wallet
- Use MetaMask with address `0x46a89Fe...`
- Approve connection

### 3. Create Account
- Enter email
- Verify with OTP

### 4. Claim Agent
- Click "Claim Agent"
- Sign transaction (costs gas)
- Copy your agent wallet address

### 5. Fund Agent Wallet
Send to your Simmer agent address:
- **USDC.e**: $50-75
- **POL**: 2-5 for gas

### 6. Install Skill
In Telegram bot, type:
```
clawhub install polymarket-fast-loop
```

Or go to Simmer Dashboard → Skills → Find "Polymarket Fast Loop" → Install

### 7. Configure Strategy

Copy-paste this into Telegram bot after skill install:

---

**CONFIGURATION:**

```
Configure Polymarket trading:

STRATEGY: ValueBetting
- Edge threshold: 5%
- Max position size: $10 (13% of bankroll)
- Min market volume: 300
- Max concurrent positions: 1

MARKETS:
- BTC 5-minute only
- No ETH (correlation too high)

RISK MANAGEMENT:
- Daily loss limit: $10 (halt if reached)
- Max drawdown: 20%
- Consecutive loss halt: 3 trades
- Cooldown period: 2 hours

SCANNING:
- Interval: 5 seconds
- Slippage tolerance: 1%

CIRCUIT BREAKERS:
- Auto-halt on daily loss limit
- Auto-halt on 3 consecutive losses
- Auto-halt on 20% drawdown
```

---

### 8. Start Paper Trading
```
Start paper trading
```

Run for 24-48 hours to verify signals work.

### 9. Go Live
```
Start live trading
```

## Monitoring Commands

Check status:
```
Show open positions
Show P&L today
Show trading stats
```

Emergency stop:
```
Stop all trading
Close all positions
```

## Expected Behavior

Based on backtests:
- 10-20 trades per day
- Win rate: 70-80%
- Avg return per trade: $0.50-2
- Daily profit target: $5-15

## Important Notes

⚠️ **Start with paper trading first!**
⚠️ **Live trading = real money at risk**
⚠️ **You CAN lose the $75**
⚠️ **Set daily loss limit strictly**

## Troubleshooting

**Skill not found?**
→ Check spelling: `polymarket-fast-loop`

**No markets showing?**
→ Check if agent wallet is funded with POL

**Trades not executing?**
→ Check slippage settings, increase to 2%

**Bot not responding?**
→ Check Simmer dashboard status

## Backup Plan

If Simmer fails:
1. Go to https://polymarket.com
2. Trade manually using ValueBetting strategy
3. Wait for edge >5%, buy, hold to resolution
4. Use insights from research docs