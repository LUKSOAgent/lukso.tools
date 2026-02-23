# Polymarket Trading Bot - Status

## Current: Bankr Momentum Trader
- **Bot:** `skills/bankr/polymarket_momentum_trader.py`
- **Log:** `skills/bankr/bankr_trader.log`
- **Network:** Polygon (via Bankr API)
- **Strategy:** Multi-timeframe momentum (2m, 5m, 10m), confidence ≥ 0.65
- **Trade size:** $10
- **Cooldown:** 5 min between trades
- **Price source:** Coinbase/Binance real-time BTC

## Previous: Simmer/Fast-Loop (DISABLED 2026-02-18)
- Cron jobs `polymarket-fast-loop-trader` + `polymarket-bot-watchdog` disabled
- `polymarket-auto-redeem` still active (for old Simmer positions, every 6h)
- Simmer wallet: 0x46a89Fe8123840906aF6F1B3A0F24C891dbb9Baa

## Monitoring
- Check log: `tail -20 skills/bankr/bankr_trader.log`
- If no cycles for >10min: restart bot process

---
*Updated: 2026-02-18*
