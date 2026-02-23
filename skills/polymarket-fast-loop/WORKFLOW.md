# Polymarket FastLoop Trading Workflow

## Overview
Automated BTC 5-minute fast market trading using Chainlink oracle price signals with 60-second edge.

## Architecture

### Signal Source
- **Primary:** Chainlink BTC/USD oracle on Polygon
- **Feed:** `0xc907E116054Ad103354f2D350FD2514433D57F6f`
- **Update frequency:** Every 2-5 minutes
- **Lookback:** 5 minutes (matches Chainlink update frequency)

### Trading Logic
1. **Momentum Detection:** Compare current vs 5-min ago price
2. **Edge Calculation:** Expected price based on momentum magnitude
3. **Position Sizing:** $2-$15 based on volume and EV
4. **Fee Awareness:** Only trade if EV > 0 after Polymarket's 10% fee

### Wallet Setup
- **Address:** `0x46a89Fe8123840906aF6F1B3A0F24C891dbb9Baa`
- **Type:** External (MetaMask imported)
- **Signing:** Local via Simmer Python SDK
- **Network:** Polygon (USDC.e for trading)

### Required Environment Variables
```bash
export SIMMER_API_KEY="sk_live_..."
export WALLET_PRIVATE_KEY="0x..."
```

## Installation Requirements

```bash
pip install simmer-sdk py-order-utils py-clob-client
```

## Trading Execution

### Manual Test Trade
```python
from simmer_sdk import SimmerClient

client = SimmerClient(api_key="sk_live_...")

# Link wallet (one-time)
client.link_wallet()

# Execute trade with GTC order
result = client.trade(
    market_id="uuid",
    side="yes",  # or "no"
    amount=10.0,
    venue="polymarket",
    order_type="GTC",  # Good Till Cancelled
    reasoning="BTC momentum signal"
)
```

### Key Findings

1. **External Wallet Required:** Simmer API requires local signing for imported wallets
2. **Simmer SDK:** Must use Python SDK (`simmer_sdk`) not raw REST API
3. **GTC Orders:** Use GTC (Good Till Cancelled) for better fill rates on low liquidity markets
4. **Minimum Shares:** 5 shares minimum per order
5. **USDC.e Required:** Polymarket uses bridged USDC, not native USDC

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "External wallet requires pre-signed order" | Missing SDK signing | Use `simmer_sdk` Python package |
| "Missing Polymarket API credentials" | Wallet not linked | Run `client.link_wallet()` first |
| "Order too small" | Below 5 shares minimum | Trade minimum $5 at $0.50 price |
| "takerAmount exceeds max 4 decimal precision" | Rounding error | Use `round(shares, 4)` before int() |

## Configuration

### Current Production Settings
```json
{
  "entry_threshold": 0.02,
  "min_momentum_pct": 0.15,
  "max_position": 10.0,
  "daily_budget": 10000.0,
  "signal_source": "chainlink",
  "lookback_minutes": 5,
  "window": "5m"
}
```

### Cron Job
- **Schedule:** Every minute (`* * * * *`)
- **Job ID:** `f202cf9c-2d06-4382-b99c-fe3a4efe9bd6`
- **Command:** 
  ```bash
  cd /root/.openclaw/workspace/skills/polymarket-fast-loop && \
  export SIMMER_API_KEY="..." && \
  export WALLET_PRIVATE_KEY="..." && \
  python3 fastloop_trader.py --live
  ```

## Monitoring

### Check Portfolio
```python
from simmer_sdk import SimmerClient
client = SimmerClient()
portfolio = client.get_portfolio()
print(f"Balance: ${portfolio.balance_usdc:.2f}")
print(f"Exposure: ${portfolio.total_exposure:.2f}")
```

### Check Positions
```python
positions = client.get_positions()
for p in positions:
    print(f"{p.question}: {p.side} @ ${p.current_price}")
    print(f"  P&L: ${p.pnl:+.2f}")
```

## Test Trade History

- **Date:** 2026-02-17
- **Market:** Bitcoin Up or Down - Feb 18, 9:30AM-9:35AM ET
- **Side:** YES
- **Amount:** $5
- **Trade ID:** `6c76f9e6-2389-4d99-99e5-6a9f8bed51ba`
- **Result:** Success (GTC order on book)

## Open Position

- **Market:** Bitcoin Up or Down - Feb 18, 9:55AM-10:00AM ET  
- **Side:** YES
- **Shares:** 10.0
- **Entry:** $0.50
- **Current:** $0.505
- **P&L:** +$0.05 (+1%)

## Next Steps

1. Monitor bot execution every minute
2. Review P&L daily
3. Adjust thresholds based on market volatility
4. Consider adding stop-loss logic

---
Last Updated: 2026-02-17
