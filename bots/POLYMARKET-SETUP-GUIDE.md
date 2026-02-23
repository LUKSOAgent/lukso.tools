# Polymarket Trading Bot - Simmer Installation Guide

## Prerequisites
- Wallet funded with USDC + POL on Polygon (`0x46a89Fe8123840906aF6F1B3A0F24C891dbb9Baa`)
- Telegram account
- $75 USDC on Polymarket (already done ✅)

## Step 1: Claim Simmer Agent

1. Go to https://simmer.markets
2. Connect wallet (MetaMask with `0x46a89Fe...`)
3. Create account with email
4. Click "Claim Agent" → Approve transaction
5. Copy your agent wallet address

## Step 2: Fund Simmer Wallet

Send to your Simmer agent wallet:
- **USDC.e**: $50-75 for trading
- **POL**: 2-5 for gas fees

Network: **Polygon**

## Step 3: Install Polymarket Skill

In your Telegram bot (after connecting Simmer):

```
clawhub install polymarket-fast-loop
```

Or manual install:
1. Go to Simmer Dashboard → Skills tab
2. Find "Polymarket Fast Loop"
3. Click Install → Copy command
4. Paste in Telegram bot

## Step 4: Configure Trading Rules

Based on backtest results (ValueBetting best performance):

Send to Telegram bot:

```
Configure Polymarket trading:
- Strategy: ValueBetting
- Markets: BTC 5-minute only
- Edge threshold: 5%
- Max position: $10 (13% of bankroll)
- Min volume: 300
- Max positions: 1 at a time
- Daily loss limit: $10 (halt if reached)
- Scan interval: 5 seconds
```

## Step 5: Risk Management (CRITICAL)

Add these circuit breakers:

```
Set circuit breakers:
- Daily loss halt: $10
- Consecutive loss halt: 3 trades
- Drawdown halt: 20%
- Cooldown period: 2 hours
```

## Step 6: Start Trading

```
Start paper trading
```

Run for 24-48 hours to verify.

Then:
```
Start live trading
```

## Monitoring

Track in Simmer Dashboard:
- P&L
- Win rate
- Sharpe ratio
- Open positions

## Emergency Stop

If something goes wrong:
```
Stop all trading
Close all positions
```

Or manually withdraw from Polymarket.

## Expected Performance (from backtests)

With $75 bankroll:
- Expected return: ~30% monthly (optimistic)
- Win rate: ~70-80%
- Max drawdown: <5%
- Daily trades: 10-20

**⚠️ WARNING**: Backtests ≠ reality. Start with $10, scale after 50+ profitable trades.