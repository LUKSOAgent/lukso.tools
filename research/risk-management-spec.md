# Polymarket Automated Trading Risk Management Framework
## Specification Document v1.0

**Bankroll:** $75 USD  
**Market Type:** Binary Prediction Markets (Polymarket)  
**Target Markets:** Short-term crypto (5-min BTC), events, politics  
**Last Updated:** 2026-02-16

---

## Executive Summary

This document establishes a comprehensive risk management framework for automated trading on Polymarket with a modest $75 bankroll. The framework prioritizes capital preservation while allowing for sustainable growth through disciplined position sizing, strict loss limits, and quantitative risk controls.

**Key Principles:**
- **Survival First:** Preserve capital to trade another day
- **Asymmetric Risk:** Limited upside (1x), total downside (1x) requires edge discipline
- **Variance Management:** Small bankrolls are vulnerable to streaks
- **Correlation Awareness:** Multiple simultaneous positions amplify risk

---

## 1. Position Sizing Models

### 1.1 Recommended: Fractional Kelly with Constraints

The Kelly Criterion provides the optimal bet size to maximize log-utility of wealth growth. For binary markets:

**Kelly Formula:**
```
f* = (bp - q) / b

Where:
- f* = fraction of bankroll to bet
- b = odds received (decimal odds - 1)
- p = probability of winning (your estimated edge)
- q = probability of losing (1 - p)
```

**Polymarket Adaptation:**
Polymarket prices represent implied probability. If you believe the true probability differs:

```
Example: Market prices YES at $0.65 (65% implied)
You believe true probability = 75%
Market odds: Buy YES at $0.65, win $1.00
Effective b = (1 - 0.65) / 0.65 = 0.538

f* = (0.538 * 0.75 - 0.25) / 0.538
f* = (0.4035 - 0.25) / 0.538
f* = 0.285 (28.5% of bankroll - TOO HIGH for small bankroll)
```

### 1.2 Practical Implementation: Quarter-Kelly with Caps

For a $75 bankroll, full Kelly is too aggressive due to:
- Estimation errors in probability
- Multiple concurrent positions
- Psychological/emotional impact of drawdowns

**Recommended Sizing Formula:**
```python
def calculate_position_size(bankroll, market_price, true_prob_estimate, confidence):
    """
    Calculate position size using fractional Kelly with safety constraints
    
    Args:
        bankroll: Current available capital
        market_price: Current market price (0.01 to 0.99)
        true_prob_estimate: Your estimated true probability (0-1)
        confidence: 0-1 scale of confidence in estimate (reduces size)
    
    Returns:
        position_size: Dollar amount to invest
    """
    
    # Edge calculation
    implied_prob = market_price
    edge = true_prob_estimate - implied_prob
    
    if edge <= 0:
        return 0  # No edge, no trade
    
    # Kelly fraction
    b = (1 - market_price) / market_price  # Decimal odds - 1
    q = 1 - true_prob_estimate
    kelly = (b * true_prob_estimate - q) / b
    
    # Apply fractional Kelly (1/4 Kelly for small bankroll)
    fractional_kelly = kelly * 0.25
    
    # Apply confidence discount
    confidence_adjusted = fractional_kelly * confidence
    
    # Calculate dollar amount
    raw_size = bankroll * confidence_adjusted
    
    # Apply hard caps based on bankroll tier
    if bankroll < 50:
        max_position = 5.00  # $5 cap for depleted bankroll
        max_pct = 0.15       # 15% max
    elif bankroll < 100:
        max_position = 10.00  # $10 cap
        max_pct = 0.20        # 20% max
    else:
        max_position = 15.00
        max_pct = 0.25
    
    position_size = min(raw_size, max_position, bankroll * max_pct)
    
    # Minimum trade size (Polymarket practical minimum)
    if position_size < 1.00:
        return 0  # Skip trades below $1
    
    return round(position_size, 2)
```

### 1.3 Position Size Tiers ($75 Bankroll)

| Bankroll Level | Max Single Position | Max % of Bankroll | Kelly Fraction |
|---------------|---------------------|-------------------|----------------|
| $75-100       | $10.00             | 20%               | 1/4 Kelly      |
| $50-75        | $7.50              | 15%               | 1/4 Kelly      |
| $25-50        | $5.00              | 15%               | 1/6 Kelly      |
| <$25          | $3.00              | 12%               | 1/8 Kelly      |

### 1.4 Alternative: Fixed Fractional Model

Simpler approach for initial deployment:

```
Position Size = Bankroll × Fixed%

Recommended fixed fractions by edge confidence:
- High confidence (>80%): 10% of bankroll
- Medium confidence (60-80%): 7% of bankroll
- Lower confidence (50-60%): 4% of bankroll
```

**Fixed Fractional Tiers ($75 Bankroll):**

| Confidence Level | Position Size | Max Concurrent |
|-----------------|---------------|----------------|
| High (80%+)     | $7.50         | 3 positions    |
| Medium (60-80%) | $5.00         | 4 positions    |
| Low (50-60%)    | $3.00         | 5 positions    |

---

## 2. Stop-Loss and Take-Profit Mechanisms

### 2.1 Challenge: Binary Markets

Traditional stop-losses don't apply directly to binary options:
- Position value is already bounded [0, 1]
- Can't "exit early" at arbitrary prices without market liquidity
- Polymarket resolves to 0 or 1 at expiration

### 2.2 Adapted Stop-Loss Framework

**Type A: Time-Based Stops (Primary)**
```
If position held > X hours without favorable movement:
- Re-evaluate edge
- Exit if edge no longer exists
- Prevents capital tie-up in stale positions
```

| Market Type        | Time Stop | Rationale                    |
|-------------------|-----------|------------------------------|
| 5-min BTC         | 30 min    | Short-term, fast resolution  |
| Daily crypto      | 6 hours   | Intraday momentum check      |
| Event markets     | 24 hours  | News cycle re-evaluation     |
| Political         | 48 hours  | Polling/sentiment shifts     |

**Type B: Opposing Edge Stop (Secondary)**
```
If market moves against position AND:
- New implied probability differs from estimate by >15%
- Contrary evidence emerges
- Confidence in original thesis drops below 40%

Then: Exit position immediately (accept loss)
```

**Type C: Maximum Loss Per Position**
```
Hard cap: Never lose more than 15% of bankroll on single position
With $10 position: Maximum loss = $10 (full binary loss)
Position sizing already enforces this constraint
```

### 2.3 Take-Profit Framework

**Early Exit Opportunities:**

| Scenario                          | Action                    |
|----------------------------------|---------------------------|
| Position up >50% of max gain     | Take 50% profit, hold 50% |
| Edge evaporates (market moves)   | Full exit                 |
| Better opportunity identified    | Rotate capital            |
| Time stop triggered (favorable)  | Partial exit              |

**Profit Taking Schedule (Scaled Exit):**
```python
def evaluate_exit_opportunity(position, current_price, entry_price, time_held):
    """
    Returns: 'hold', 'partial_exit', 'full_exit'
    """
    profit_pct = (current_price - entry_price) / entry_price
    
    # Tiered profit taking
    if profit_pct >= 0.50:  # 50% profit
        return 'partial_exit'  # Take 50% off
    
    if profit_pct >= 0.80:  # 80% profit
        return 'full_exit'   # Don't be greedy
    
    # Time-based for 5-min BTC markets
    if time_held > 30 and profit_pct > 0.20:
        return 'partial_exit'
    
    return 'hold'
```

---

## 3. Daily and Weekly Loss Limits

### 3.1 Circuit Breakers

**Daily Loss Limits:**

| Bankroll Level | Daily Stop Loss | Weekly Stop Loss | Consequence              |
|---------------|-----------------|------------------|--------------------------|
| $75+          | $10 (13%)       | $25 (33%)        | Trading halt for review  |
| $50-75        | $7.50 (12%)     | $18 (30%)        | Trading halt for review  |
| $25-50        | $5 (15%)        | $12 (30%)        | Trading halt for review  |
| <$25          | $3 (12%)        | $8 (32%)         | Trading halt + reassess  |

**Implementation:**
```python
class CircuitBreaker:
    def __init__(self, daily_limit, weekly_limit):
        self.daily_limit = daily_limit
        self.weekly_limit = weekly_limit
        self.daily_pnl = 0
        self.weekly_pnl = 0
        self.trading_enabled = True
    
    def update_pnl(self, trade_pnl):
        self.daily_pnl += trade_pnl
        self.weekly_pnl += trade_pnl
        
        # Check limits
        if self.daily_pnl <= -self.daily_limit:
            self.trading_enabled = False
            self.trigger_daily_stop()
        
        if self.weekly_pnl <= -self.weekly_limit:
            self.trading_enabled = False
            self.trigger_weekly_stop()
    
    def trigger_daily_stop(self):
        """Halt trading for 24 hours, send alert"""
        # Log event
        # Notify operator
        # Require manual reset
        pass
    
    def trigger_weekly_stop(self):
        """Halt trading for week, mandatory strategy review"""
        # Log event
        # Generate performance report
        # Require strategy adjustment before resuming
        pass
    
    def reset_daily(self):
        """Called at market open/UTC midnight"""
        self.daily_pnl = 0
        # Weekly persists until Sunday 23:59 UTC
```

### 3.2 Consecutive Loss Rule

**3-Strike Rule:**
```
If 3 consecutive losing trades:
1. Pause trading for 2 hours
2. Force strategy review
3. Reduce position sizes by 50% for next 5 trades
4. Only resume full sizing after 2 consecutive wins
```

---

## 4. Correlation Analysis

### 4.1 5-Minute BTC Market Dynamics

**Market Structure:**
- Polymarket offers 5-minute binary options on BTC price direction
- Markets resolve based on oracle price at expiration
- Typical market duration: 5 minutes
- Overlapping markets available continuously

**Correlation Assessment:**

| Factor                    | Correlation Level | Impact on Risk |
|--------------------------|-------------------|----------------|
| Sequential 5-min windows | High (>0.70)      | **CRITICAL**   |
| Same-hour markets        | Medium (0.40-0.60)| High           |
| Different day same time  | Low (0.10-0.30)   | Medium         |
| BTC/ETH pairs            | High (>0.80)      | **CRITICAL**   |
| Crypto/Traditional       | Low (0.00-0.20)   | Low            |

**Key Finding:** Sequential 5-minute BTC markets are HIGHLY correlated due to:
- Persistent momentum in short timeframes
- Shared underlying price feed
- Market microstructure effects
- Similar participant behavior

### 4.2 Correlation-Adjusted Position Sizing

**Base Correlation Matrix (Estimated):**

```
                BTC-5m-1  BTC-5m-2  BTC-5m-3  ETH-5m  Event
BTC-5m-1 (current)  1.00     0.75      0.60     0.85    0.10
BTC-5m-2 (next)     0.75     1.00      0.75     0.80    0.10
BTC-5m-3 (+10min)   0.60     0.75      1.00     0.75    0.10
ETH-5m              0.85     0.80      0.75     1.00    0.10
Event market        0.10     0.10      0.10     0.10    1.00
```

**Portfolio Heat Calculation:**
```python
def calculate_portfolio_heat(positions, correlation_matrix):
    """
    Calculate total portfolio risk accounting for correlations
    """
    total_heat = 0
    n = len(positions)
    
    for i in range(n):
        for j in range(n):
            if i == j:
                total_heat += positions[i]['size'] ** 2
            else:
                corr = correlation_matrix[i][j]
                total_heat += positions[i]['size'] * positions[j]['size'] * corr
    
    return total_heat ** 0.5  # Portfolio standard deviation equivalent

# Example
positions = [
    {'market': 'BTC-5m-1', 'size': 5.00},
    {'market': 'BTC-5m-2', 'size': 5.00},  # Highly correlated!
]

# Uncorrelated risk would be: $10
# Correlated risk (0.75): effectively ~$9.68 concentrated exposure
```

### 4.3 Correlation-Based Constraints

**Maximum Correlated Exposure:**

| Correlation Band | Max Concurrent Exposure | Example |
|-----------------|------------------------|---------|
| >0.70 (High)    | $10 total              | 2 BTC 5-min markets |
| 0.40-0.70 (Med) | $15 total              | BTC + ETH |
| <0.40 (Low)     | $20 total              | Crypto + Politics |
| Uncorrelated    | $25 total              | Mixed portfolio |

**Correlation Rules:**
```
1. NEVER hold >2 sequential 5-min BTC positions simultaneously
2. If in BTC position, skip next 5-min BTC window
3. Max 1 crypto position at a time (BTC or ETH, not both)
4. Event markets can run parallel to crypto (low correlation)
5. Political markets can run parallel to everything
```

### 4.4 Practical Correlation Monitoring

**Data Collection:**
```python
def log_market_outcome(market_id, outcome, timestamp):
    """Store outcomes for correlation analysis"""
    # Log to database
    # Track win/loss patterns across market types
    # Update correlation estimates weekly
```

**Weekly Correlation Report:**
```
1. Calculate actual correlation from past 100 trades
2. Compare to estimated correlation matrix
3. Adjust position limits if actual > estimated
4. Identify unexpected correlations
```

---

## 5. Drawdown Management

### 5.1 Drawdown Definitions

| Metric          | Definition                                    | Critical Level |
|----------------|-----------------------------------------------|----------------|
| Current DD     | (Peak - Current) / Peak                       | >20%           |
| Max Historical | Largest DD from previous peak                 | >30%           |
| Recovery Time  | Time to return to previous peak               | >2 weeks       |
| Underwater     | Consecutive losing days                       | >3 days        |

### 5.2 Drawdown-Based Position Scaling

**Dynamic Sizing Based on Drawdown:**

```python
def get_drawdown_multiplier(current_drawdown):
    """
    Reduce position sizes during drawdowns
    """
    if current_drawdown < 0.10:      # <10% DD
        return 1.00  # Full size
    elif current_drawdown < 0.15:    # 10-15% DD
        return 0.75  # 75% size
    elif current_drawdown < 0.20:    # 15-20% DD
        return 0.50  # 50% size
    elif current_drawdown < 0.25:    # 20-25% DD
        return 0.33  # 33% size
    else:                             # >25% DD
        return 0.00  # Trading halt
```

**Drawdown Recovery Protocol:**

| Phase           | Drawdown  | Action                              |
|----------------|-----------|-------------------------------------|
| Normal          | <10%      | Normal operations                   |
| Caution         | 10-15%    | Reduce size 25%, review strategy    |
| Warning         | 15-20%    | Reduce size 50%, daily review       |
| Critical        | 20-25%    | Reduce size 66%, mandatory pause    |
| Halt            | >25%      | Full stop, strategy overhaul        |

### 5.3 Watermark-Based Sizing

**High Watermark Approach:**
```
Base Bankroll = $75 (starting)
High Watermark = $75 (peak achieved)

Position sizes calculated from: min(Current, High Watermark)
This prevents "betting up" during winning streaks that inflate bankroll
```

**Example:**
```
Day 1: Bankroll $75, HWM $75 → Size from $75
Day 5: Bankroll $90, HWM $90 → Size from $90 (but capped at $15 max)
Day 10: Bankroll $70, HWM $90 → Size from $70 (not $90!)
```

---

## 6. Risk of Ruin Calculations

### 6.1 Mathematical Framework

**Risk of Ruin (RoR)** is the probability of losing the entire bankroll.

**Simplified RoR Formula (Fixed Fraction):**
```
RoR ≈ ((1 - Edge) / (1 + Edge)) ^ (Bankroll / Average Bet)

Where Edge = Expected value per trade (as decimal)
```

### 6.2 RoR Calculations for $75 Bankroll

**Scenario Analysis:**

| Win Rate | Avg Win | Avg Loss | Edge  | Bet Size | RoR     | Assessment |
|----------|---------|----------|-------|----------|---------|------------|
| 55%      | $1.00   | $1.00    | 10%   | $5       | 8.2%    | Moderate   |
| 55%      | $1.00   | $1.00    | 10%   | $10      | 26.8%   | High       |
| 55%      | $1.00   | $1.00    | 10%   | $15      | 42.1%   | Dangerous  |
| 52%      | $1.00   | $1.00    | 4%    | $5       | 36.4%   | High       |
| 52%      | $1.00   | $1.00    | 4%    | $10      | 58.7%   | Very High  |
| 60%      | $1.00   | $1.00    | 20%   | $5       | 1.3%    | Low        |
| 60%      | $1.00   | $1.00    | 20%   | $10      | 6.5%    | Moderate   |

### 6.3 Kelly-Based RoR

With fractional Kelly sizing, RoR drops significantly:

| Kelly Fraction | RoR (55% WR, 10% Edge) | Recommended? |
|---------------|------------------------|--------------|
| Full Kelly    | 13.5%                  | No           |
| 1/2 Kelly     | 3.2%                   | Marginal     |
| 1/4 Kelly     | 0.8%                   | Yes          |
| 1/8 Kelly     | 0.2%                   | Conservative |

**Recommendation: Quarter-Kelly keeps RoR <1% with reasonable edge assumptions**

### 6.4 Ruin Thresholds

**Soft Ruin (Stop Trading):** $25 (33% of initial)
- Preserves capital for restart
- Indicates strategy failure
- Requires major review

**Hard Ruin:** $5 (Polymarket minimum practical)
- Cannot meaningfully trade
- Strategy has failed
- Requires new bankroll

### 6.5 RoR Mitigation Strategies

| Strategy               | Impact on RoR | Trade-off           |
|-----------------------|---------------|--------------------|
| Smaller position sizes| -60% RoR      | Slower growth      |
| Higher win rate (edge)| -80% RoR      | Fewer trades       |
| Stop at soft ruin     | -40% RoR      | Opportunity cost   |
| Diversification       | -30% RoR      | Complexity         |
| Weekly loss limits    | -25% RoR      | May miss recovery  |

---

## 7. Implementation Guidelines

### 7.1 Configuration Parameters

```python
RISK_CONFIG = {
    # Bankroll
    'initial_bankroll': 75.00,
    'soft_ruin_threshold': 25.00,
    'high_watermark': 75.00,
    
    # Position Sizing
    'kelly_fraction': 0.25,
    'max_position_pct': 0.20,
    'max_position_dollars': 10.00,
    'min_position_dollars': 1.00,
    
    # Loss Limits
    'daily_loss_limit': 10.00,
    'weekly_loss_limit': 25.00,
    'consecutive_losses_halt': 3,
    
    # Drawdown
    'drawdown_scaling': True,
    'max_drawdown_halt': 0.25,
    
    # Correlation
    'max_correlated_exposure': 10.00,
    'max_concurrent_crypto': 1,
    'sequential_btc_gap': 1,  # Skip 1 window between BTC trades
    
    # Take Profit
    'partial_exit_profit_pct': 0.50,
    'full_exit_profit_pct': 0.80,
    
    # Time Stops
    'time_stop_5min_btc': 30,  # minutes
    'time_stop_event': 24,     # hours
}
```

### 7.2 Pre-Trade Checklist

```python
def pre_trade_checklist(market, proposed_size, current_portfolio):
    """
    Returns: (approved: bool, reason: str)
    """
    checks = [
        # 1. Circuit breaker
        (circuit_breaker.trading_enabled, "Circuit breaker active"),
        
        # 2. Bankroll check
        (bankroll.current > RISK_CONFIG['soft_ruin_threshold'], 
         "Below soft ruin threshold"),
        
        # 3. Daily loss limit
        (daily_pnl > -RISK_CONFIG['daily_loss_limit'],
         "Daily loss limit reached"),
        
        # 4. Weekly loss limit
        (weekly_pnl > -RISK_CONFIG['weekly_loss_limit'],
         "Weekly loss limit reached"),
        
        # 5. Drawdown check
        (current_drawdown < RISK_CONFIG['max_drawdown_halt'],
         "Max drawdown halt active"),
        
        # 6. Correlation check
        (check_correlation_exposure(market, current_portfolio),
         "Correlation limit exceeded"),
        
        # 7. Position size check
        (proposed_size <= RISK_CONFIG['max_position_dollars'],
         "Position exceeds max size"),
        
        # 8. Edge confirmation
        (calculated_edge > 0, "No positive edge detected"),
        
        # 9. Consecutive losses
        (consecutive_losses < RISK_CONFIG['consecutive_losses_halt'],
         "Consecutive loss halt active"),
    ]
    
    for check, reason in checks:
        if not check:
            return False, reason
    
    return True, "All checks passed"
```

### 7.3 Risk Monitoring Dashboard

**Real-Time Metrics to Track:**

```python
class RiskMonitor:
    @property
    def current_metrics(self):
        return {
            # Capital
            'bankroll': self.bankroll,
            'available_capital': self.available,
            'exposure': self.total_exposure,
            'exposure_pct': self.total_exposure / self.bankroll,
            
            # Performance
            'daily_pnl': self.daily_pnl,
            'weekly_pnl': self.weekly_pnl,
            'total_pnl': self.total_pnl,
            'win_rate': self.win_rate,
            'profit_factor': self.profit_factor,
            
            # Risk
            'current_drawdown': self.current_drawdown,
            'max_drawdown': self.max_drawdown,
            'risk_of_ruin': self.calculate_ror(),
            'portfolio_heat': self.calculate_heat(),
            
            # Limits
            'daily_limit_remaining': self.daily_limit - abs(min(self.daily_pnl, 0)),
            'weekly_limit_remaining': self.weekly_limit - abs(min(self.weekly_pnl, 0)),
            'positions_until_halt': RISK_CONFIG['consecutive_losses_halt'] - self.consecutive_losses,
            
            # Correlation
            'crypto_exposure': self.crypto_exposure,
            'event_exposure': self.event_exposure,
            'correlated_pct': self.correlated_exposure / self.bankroll,
        }
```

### 7.4 Alert Thresholds

| Alert Level | Trigger                              | Action                    |
|-------------|--------------------------------------|--------------------------|
| INFO        | Position opened/closed               | Log only                 |
| WARNING     | Daily loss >50% of limit             | Notification             |
| WARNING     | Drawdown >15%                        | Notification             |
| CRITICAL    | Daily loss limit reached             | Trading halt + alert     |
| CRITICAL    | Soft ruin threshold breached         | Trading halt + alert     |
| EMERGENCY   | Consecutive losses = halt threshold  | Immediate stop + review  |

---

## 8. Backtesting and Validation

### 8.1 Monte Carlo Simulation

```python
import numpy as np

def monte_carlo_risk_analysis(
    initial_bankroll=75,
    win_rate=0.55,
    avg_win=1.0,
    avg_loss=1.0,
    bet_size=5,
    num_trades=500,
    num_simulations=10000
):
    """
    Run Monte Carlo to estimate RoR and distribution of outcomes
    """
    results = []
    
    for _ in range(num_simulations):
        bankroll = initial_bankroll
        peak = bankroll
        max_dd = 0
        
        for _ in range(num_trades):
            if bankroll <= 5:  # Hard ruin
                break
            
            # Simulate trade
            if np.random.random() < win_rate:
                bankroll += bet_size * avg_win
            else:
                bankroll -= bet_size * avg_loss
            
            # Track peak and drawdown
            if bankroll > peak:
                peak = bankroll
            dd = (peak - bankroll) / peak
            max_dd = max(max_dd, dd)
        
        results.append({
            'final_bankroll': bankroll,
            'ruined': bankroll <= 5,
            'max_drawdown': max_dd
        })
    
    # Calculate statistics
    ruin_rate = sum(1 for r in results if r['ruined']) / len(results)
    avg_final = np.mean([r['final_bankroll'] for r in results])
    avg_max_dd = np.mean([r['max_drawdown'] for r in results])
    
    return {
        'risk_of_ruin': ruin_rate,
        'expected_final_bankroll': avg_final,
        'expected_max_drawdown': avg_max_dd
    }
```

### 8.2 Recommended Backtest Scenarios

| Scenario          | Win Rate | Edge  | Bet Size | Expected RoR | Acceptable? |
|------------------|----------|-------|----------|--------------|-------------|
| Conservative     | 52%      | 4%    | $3       | ~15%         | Marginal    |
| Base Case        | 55%      | 10%   | $5       | ~8%          | Yes         |
| Optimistic       | 58%      | 16%   | $7       | ~3%          | Yes         |
| Aggressive       | 55%      | 10%   | $10      | ~27%         | No          |
| Pessimistic      | 50%      | 0%    | $5       | ~85%         | No          |

---

## 9. Emergency Procedures

### 9.1 Emergency Shutdown Triggers

```python
EMERGENCY_TRIGGERS = [
    'Bankroll drops below $25 (soft ruin)',
    'Daily loss exceeds $15',
    '3 consecutive losing trades with >$5 each',
    'Drawdown exceeds 25% from peak',
    'API errors preventing risk checks',
    'Market making abnormal moves (>20% in 1 min)',
    'Personal/emotional decision to halt',
]
```

### 9.2 Recovery Protocol

| Stage | Condition              | Action                               | Duration      |
|-------|----------------------|--------------------------------------|---------------|
| 1     | Emergency triggered   | Close all positions, halt trading    | Immediate     |
| 2     | Assessment           | Review logs, identify cause          | 24 hours      |
| 3     | Paper trading        | Run strategy on paper                | 3-7 days      |
| 4     | Micro sizing         | Trade at 20% normal size             | 1 week        |
| 5     | Gradual return       | Increase size by 20% weekly          | Until full    |
| 6     | Full resumption      | Return to normal sizing              | After success |

---

## 10. Summary: Key Rules Reference

### Absolute Rules (Never Violate)

1. **Max Position:** Never risk more than $10 (13% of bankroll) on single trade
2. **Daily Stop:** Halt trading after $10 daily loss
3. **Soft Ruin:** Stop trading if bankroll falls below $25
4. **Correlation:** Never hold >1 crypto position simultaneously
5. **Minimum Edge:** Only trade when estimated edge >5%

### Sizing Formula (Quick Reference)

```
Base Size = min($75 × 0.07 × Confidence, $10)
Drawdown Adjustment = Base Size × (1 - Drawdown/0.25)
Final Size = max(Drawdown Adjustment, $1)
```

### Risk Budget Allocation

| Risk Type         | Budget   | % of Bankroll |
|------------------|----------|---------------|
| Single Position   | $10      | 13%           |
| Daily Loss        | $10      | 13%           |
| Weekly Loss       | $25      | 33%           |
| Max Drawdown      | $19      | 25%           |

---

## Appendix A: Mathematical Derivations

### A.1 Kelly Criterion Derivation

For binary outcome with probability p of winning b:1 odds:

```
Expected log wealth: E[log(1 + f*b)] = p*log(1 + f*b) + (1-p)*log(1 - f)

Taking derivative and setting to 0:
p*b/(1 + f*b) - (1-p)/(1 - f) = 0

Solving:
f* = (p*(b+1) - 1) / b = (bp - q) / b
```

### A.2 Risk of Ruin Approximation

For fixed fraction f with edge e:

```
RoR ≈ ((1 - e) / (1 + e)) ^ (B / f)

Where B = bankroll, f = bet size
```

### A.3 Correlation-Adjusted Variance

For portfolio with n assets:

```
σ²_p = ΣΣ w_i × w_j × σ_i × σ_j × ρ_ij

Where ρ_ij is correlation between assets i and j
```

---

## Document Control

| Version | Date       | Author | Changes          |
|---------|------------|--------|------------------|
| 1.0     | 2026-02-16 | System | Initial release  |

---

*This document should be reviewed monthly and updated based on actual trading performance and market conditions.*
