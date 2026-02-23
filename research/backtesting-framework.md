# Polymarket Backtesting Framework

Complete paper trading and backtesting system for Polymarket strategies.

## Usage

```bash
node bots/polymarket-simulator.js
```

## What It Does

1. **Generates synthetic market data** (2000 5-minute markets)
2. **Tests 3 strategies** with paper trading
3. **Calculates metrics** (Sharpe, drawdown, win rate)
4. **Walk-forward analysis** (robustness check)

## Strategies Tested

- **ValueBetting**: 5% edge threshold
- **Momentum**: 3-period lookback
- **MeanReversion**: 8% deviation threshold

## Key Metrics

| Metric | Description |
|--------|-------------|
| Sharpe Ratio | Risk-adjusted return (>1 = good) |
| Max Drawdown | Worst peak-to-trough decline |
| Win Rate | % profitable trades (need >52% for fees) |
| WFE | Walk-forward efficiency (>60% = robust) |

## Interpreting Results

- **WFE > 60%**: Strategy is robust, not overfit
- **Sharpe > 1**: Good risk-adjusted returns
- **Win rate > 52%**: Beats fees (2% round-trip)
- **Max DD < 20%**: Acceptable risk

## Next Steps

1. Run simulation
2. Pick best strategy by Sharpe + WFE
3. Paper trade on Polymarket for 1 week
4. Deploy with $10 (not $75!) to test live
5. Scale up if profitable after 100+ trades