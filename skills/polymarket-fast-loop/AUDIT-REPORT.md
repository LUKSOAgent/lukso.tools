# Audit Report: Polymarket Fast-Loop Trading System

**Date:** 2026-02-18  
**Auditor:** Claude (subagent)  
**Status:** Read-only audit — no files modified

---

## Architecture Overview

### System Components

1. **fastloop_trader.py** (1694 lines) — Single-cycle trader. Discovers BTC 5-minute fast markets via Simmer SDK or Gamma API, fetches price signals (Chainlink/Binance/CoinGecko), and trades via Simmer SDK. Also contains the `redeem_positions()` function used by external cron.

2. **rapid_fire_trader.py** (778 lines) — Continuous loop trader. Imports from `fastloop_trader.py`. Runs every 20-30 seconds with its own `SignalGenerator` (multi-timeframe) and `RiskManager` classes. **Currently running as PID 1086595.**

3. **bot_watchdog.sh** — Cron job (every minute) that auto-restarts `rapid_fire_trader.py` if it dies or is idle >5 min.

4. **run-fastloop.sh** — Separate cron job (every 5 min) that runs `fastloop_trader.py --live --quiet` as a single cycle.

### How Simmer API Works

- **Import:** `POST /api/sdk/markets/import` — imports a Polymarket market URL into Simmer
- **Trade:** Uses `simmer_sdk.SimmerClient.trade()` with GTC orders
- **Markets:** `GET /api/sdk/markets` — lists available markets
- **Positions:** `GET /api/sdk/positions` — current holdings
- **Portfolio:** `GET /api/sdk/portfolio` — balance info
- **Redeem:** `simmer_sdk.SimmerClient.redeem()` — claims resolved positions

### The "Chainlink 60s Edge" Claim

The system reads Chainlink BTC/USD price feeds directly from Polygon RPC (`0xc907E116054Ad103354f2D350FD2514433D57F6f`). The claim is that Polymarket uses Chainlink for settlement but displays data ~60 seconds later. By reading the oracle directly, the bot sees resolution data before the crowd. **Reality:** Chainlink on Polygon updates frequently but this edge is likely marginal and widely known among serious traders.

### Both Bots Running Simultaneously

**YES — this is a problem.** Currently active:
- `rapid_fire_trader.py` — running continuously (PID 1086595), auto-restarted by watchdog cron every minute
- `run-fastloop.sh` — cron every 5 minutes runs `fastloop_trader.py --live`

Both trade the same markets with the same wallet. This creates **duplicate trade risk**.

---

## Issues Found

### 🔴 CRITICAL

**C1: API Key Hardcoded in run-fastloop.sh**
```bash
export SIMMER_API_KEY="sk_live_4d62d90f1379fc26ec0590280d244213dfe30bc7165f3317d503d4b23aac6f59"
```
A **live API key** is hardcoded in plaintext in `bots/run-fastloop.sh`. This is a credential leak. The system uses SOPS elsewhere — this key should come from `.credentials`.

**C2: Duplicate Trading — Two Bots on Same Wallet**  
Both `rapid_fire_trader.py` (continuous) and `fastloop_trader.py` (cron every 5 min) execute real trades on the same Simmer account. No coordination mechanism exists. They could both buy the same market in the same cycle.

**C3: Private Key Extraction via Regex**  
`get_private_key()` in fastloop_trader.py falls back to reading `.credentials` and extracting any hex string matching `0x[a-fA-F0-9]{64}` via regex. This is fragile and could match the wrong key if the file format changes.

### 🟠 HIGH

**H1: No Redeem Cron Job Exists**  
The task description mentions a `polymarket-auto-redeem` cron job, but **no such cron entry exists**. The only redeem mechanism is:
- `rapid_fire_trader.py` calls `redeem_positions()` at the start of each cycle and after each trade
- `fastloop_trader.py --auto-redeem` flag (but the cron doesn't use this flag)

If `rapid_fire_trader.py` is killed, no automatic redemption occurs.

**H2: Watchdog Decrypts Credentials Every Minute**  
`bot_watchdog.sh` runs `sops --decrypt` every minute via cron, even when the bot is healthy. This is wasteful and increases credential exposure surface.

**H3: `daily_budget` Config Set to $10,000**  
`config.json` has `"daily_budget": 10000.0` — effectively unlimited. The `rapid_fire_trader.py` doesn't even use this field (it uses its own `RiskManager`). Meanwhile `max_position` is $10 per trade with no real daily cap enforcement in rapid_fire.

**H4: Config Thresholds Are Extremely Aggressive**
```json
"entry_threshold": 0.01,    // 1 cent divergence triggers trade
"min_momentum_pct": 0.12,   // 0.12% momentum triggers
"min_time_remaining": 20    // Trades with only 20 seconds left
```
These are far more aggressive than the conservative config or the documented defaults (5¢, 0.5%, 60s).

### 🟡 MEDIUM

**M1: Massive Code Duplication**  
`rapid_fire_trader.py` reimplements signal generation, market discovery, and risk management that partially overlaps with `fastloop_trader.py`. The `SignalGenerator` class duplicates and extends the momentum logic.

**M2: SKILL.md Has Duplicate Sections**  
The documentation contains verbatim duplicate paragraphs (the "how it works" and fee warning sections appear twice with different content — one mentions Chainlink, one mentions Binance).

**M3: Dead Code — `execute_trade()` REST Function**  
The legacy `execute_trade()` function (REST-based) is never called. Only `execute_trade_sdk()` is used.

**M4: Dead Code — `link_wallet_to_simmer()`**  
Never called anywhere. The wallet linking function is unused.

**M5: Dead Code — `sign_order_locally()`**  
Never called. The SDK handles signing internally.

**M6: CoinGecko Fallback Is Useless**  
Returns `momentum_pct: 0` and `direction: "neutral"` always — it can never generate a trade signal.

**M7: `get_predictive_signal()` in rapid_fire_trader.py Is Dead Code**  
Defined but never called. The `SignalGenerator.generate_signal()` method is used instead.

**M8: Memory Growth in SignalGenerator**  
`deque(maxlen=200)` is bounded, but the chainlink_history JSON file grows unbounded within each hour (trimmed to 60 min). Over long runs with 20-30s cycles, this means ~120 entries/hour — manageable but unmonitored.

### 🟢 LOW

**L1: `to_minutes` Helper Defined Twice**  
The same time-parsing helper is defined in two places within `discover_fast_market_markets()`.

**L2: Broad Exception Handling**  
Many `except Exception` and bare `except:` blocks silently swallow errors, making debugging difficult.

**L3: ET/UTC Timezone Assumption**  
Hardcodes ET as UTC-5. Does not account for daylight saving time (ET is UTC-4 in summer).

**L4: Log File Growing**  
`rapid_fire_trader.log` is 9,143 lines with no rotation configured.

---

## What to Keep vs Remove

### ✅ KEEP (extract and preserve)

1. **`redeem_positions()` function** — Still needed for claiming resolved positions. Should be extracted into a standalone script or integrated into the Bankr trader.

2. **`get_chainlink_price()` function** — Useful utility for reading Chainlink oracle prices. Could be reused by other systems.

3. **`config.json` structure** — The config schema pattern is well-designed (file > env > defaults).

### 🗑️ REMOVE (obsolete)

1. **`rapid_fire_trader.py`** — Should be **killed immediately**. It's burning API calls and potentially making trades that conflict with the Bankr trader. It has its own signal logic that's separate from fastloop_trader.py.

2. **`bot_watchdog.sh`** — Only exists to restart rapid_fire_trader.py. Remove with it.

3. **`run-fastloop.sh`** (in `/bots/`) — Contains hardcoded API key. Remove.

4. **All cron entries** for this system:
   - `*/5 * * * * .../run-fastloop.sh` 
   - `* * * * * .../bot_watchdog.sh`
   - The hourly status check and daily summary

5. **Dead code** in fastloop_trader.py: `execute_trade()`, `link_wallet_to_simmer()`, `sign_order_locally()`, `get_predictive_signal()`.

6. **`fastloop_trader.py` itself** — After extracting `redeem_positions()`, the rest is obsolete since Bankr is the primary trader.

### ⚠️ MIGRATE

- **`redeem_positions()`** → Extract into a small standalone `redeem.py` script or add redeem logic to the Bankr trader. Set up a proper cron job for it.

---

## Recommendations

### Immediate Actions

1. **Kill `rapid_fire_trader.py` NOW** — `pkill -f "python3 rapid_fire_trader.py"`. It's running unsupervised, making trades every 20-30s on aggressive thresholds.

2. **Remove the watchdog cron** — `crontab -e` and delete the `bot_watchdog.sh` line, or it will restart the bot within a minute.

3. **Remove the fastloop cron** — Delete the `run-fastloop.sh` cron entry too.

4. **Rotate the exposed API key** — The key in `run-fastloop.sh` is compromised (plaintext in a file). Rotate it at simmer.markets/dashboard.

### Short-Term (This Week)

5. **Extract `redeem_positions()`** into `/root/.openclaw/workspace/skills/polymarket-fast-loop/redeem.py` (standalone, ~100 lines). Add a proper cron job:
   ```
   */10 * * * * cd /path/to/skill && python3 redeem.py --quiet
   ```

6. **Verify Bankr handles all trading** — Confirm the Bankr momentum trader covers the same markets and has its own redeem logic.

### Medium-Term

7. **Archive the fast-loop skill** — Move to `skills/_archived/polymarket-fast-loop/` to preserve history without cluttering active skills.

8. **Consider adding redeem to Bankr** — If Bankr doesn't have its own redeem logic, port the `redeem_positions()` function there to consolidate.

### Is the Redeem Cron Still Needed?

**Yes, but it doesn't currently exist as a standalone cron.** Redemption only happens inside `rapid_fire_trader.py`'s loop. Once that's killed, a new redeem mechanism is needed. Either:
- A standalone redeem cron (recommended)
- Bankr handles its own redemptions
- A heartbeat check in OpenClaw

---

## Summary

| Item | Action | Priority |
|------|--------|----------|
| Kill rapid_fire_trader.py | Immediate | 🔴 |
| Remove watchdog + fastloop crons | Immediate | 🔴 |
| Rotate exposed API key | Immediate | 🔴 |
| Extract redeem_positions() | This week | 🟠 |
| Set up standalone redeem cron | This week | 🟠 |
| Archive the skill directory | This week | 🟡 |
| Clean up dead code | Low priority | 🟢 |
