#!/usr/bin/env python3
"""
Winning Strategy Implementation for Polymarket BTC 5-Minute Trading

This module implements the "Volatility Breakout with Funding Rate Filter" strategy:
1. ATR-based volatility filtering (only trade when vol is elevated)
2. Funding rate directional bias (contrarian at extremes)
3. Order flow microstructure (volume delta analysis)
4. Kelly-inspired position sizing
"""

import requests
import json
import time
from datetime import datetime, timezone
from collections import deque
from typing import Optional, Tuple, Dict, Any

# ============================================================================
# Configuration
# ============================================================================

CONFIG = {
    "min_confidence": 0.45,       # Minimum confidence to trade
    "confidence_threshold": 0.55,  # Strong signal threshold
    "base_position_size": 10.0,    # Base $ per trade
    "max_position_size": 15.0,     # Max $ per trade
    "daily_loss_limit": 50.0,      # Stop trading after $50 loss
    "max_trades_per_hour": 6,      # Rate limiting
    "max_consecutive_losses": 3,   # Circuit breaker
    "atr_period": 10,              # ATR calculation period
    "volatility_threshold_low": 0.05,   # Skip if ATR < 0.05%
    "volatility_threshold_high": 0.15,  # High vol regime
    "funding_extreme_threshold": 0.01,   # >1% or <-1% is extreme
    "volume_delta_threshold": 0.3,       # Min volume delta ratio
    "trade_history_minutes": 5,          # Recent trades to analyze
}

# ============================================================================
# Data Fetching
# ============================================================================

class MarketDataFeed:
    """Real-time market data feed with caching."""
    
    def __init__(self):
        self.price_history = deque(maxlen=100)
        self.funding_rate = None
        self.funding_updated = 0
        self.recent_trades = deque(maxlen=200)
        self.last_trade_fetch = 0
        
    def fetch_binance_price(self) -> float:
        """Fetch current BTC price from Binance."""
        try:
            resp = requests.get(
                "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
                timeout=5
            )
            data = resp.json()
            price = float(data['price'])
            self.price_history.append({
                'price': price,
                'timestamp': time.time()
            })
            return price
        except Exception as e:
            print(f"Error fetching price: {e}")
            return self.price_history[-1]['price'] if self.price_history else 0
    
    def fetch_funding_rate(self) -> Tuple[float, str]:
        """
        Fetch BTC funding rate from Binance.
        Returns: (funding_rate, source)
        """
        # Cache for 60 seconds
        if time.time() - self.funding_updated < 60 and self.funding_rate is not None:
            return self.funding_rate, "cached"
        
        try:
            resp = requests.get(
                "https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1",
                timeout=5
            )
            data = resp.json()
            if data:
                self.funding_rate = float(data[0]['fundingRate'])
                self.funding_updated = time.time()
                return self.funding_rate, "binance"
        except Exception as e:
            print(f"Error fetching funding rate: {e}")
        
        # Fallback: return cached or 0
        return self.funding_rate or 0, "fallback"
    
    def fetch_recent_trades(self) -> list:
        """
        Fetch recent trades from Binance for volume delta analysis.
        """
        # Cache for 10 seconds
        if time.time() - self.last_trade_fetch < 10:
            return list(self.recent_trades)
        
        try:
            resp = requests.get(
                "https://api.binance.com/api/v3/trades?symbol=BTCUSDT&limit=100",
                timeout=5
            )
            trades = resp.json()
            
            # Update recent trades
            for trade in trades:
                self.recent_trades.append({
                    'price': float(trade['price']),
                    'qty': float(trade['qty']),
                    'is_buyer_maker': trade['isBuyerMaker'],
                    'timestamp': trade['time']
                })
            
            self.last_trade_fetch = time.time()
            return list(self.recent_trades)
        except Exception as e:
            print(f"Error fetching trades: {e}")
            return list(self.recent_trades)
    
    def get_price_history(self, minutes: int = 15) -> list:
        """Get price history for last N minutes."""
        cutoff = time.time() - (minutes * 60)
        return [p['price'] for p in self.price_history if p['timestamp'] >= cutoff]


# ============================================================================
# Technical Indicators
# ============================================================================

def calculate_atr(prices: list, period: int = 10) -> float:
    """
    Calculate Average True Range (ATR) for volatility measurement.
    Simplified version using price changes.
    """
    if len(prices) < period + 1:
        return 0
    
    # Calculate price changes (as proxy for true range)
    changes = [abs(prices[i] - prices[i-1]) for i in range(1, len(prices))]
    
    # Return average of last N changes
    return sum(changes[-period:]) / period


def get_volatility_regime(current_price: float, atr: float) -> Tuple[str, float]:
    """
    Classify volatility regime based on ATR percentage.
    
    Returns: (regime, multiplier)
    - regime: "LOW", "NORMAL", "HIGH"
    - multiplier: position sizing multiplier
    """
    if current_price == 0:
        return "LOW", 0
    
    atr_pct = (atr / current_price) * 100
    
    if atr_pct < CONFIG['volatility_threshold_low']:
        return "LOW", 0.0  # Don't trade - no opportunity
    elif atr_pct < CONFIG['volatility_threshold_high']:
        return "NORMAL", 1.0
    else:
        return "HIGH", 1.5  # More opportunity in high vol


# ============================================================================
# Signal Components
# ============================================================================

def get_funding_signal(funding_rate: float) -> Tuple[str, float]:
    """
    Generate signal from funding rate.
    
    Logic:
    - Extreme positive funding (>1%) = crowded longs = contrarian DOWN
    - Extreme negative funding (<-1%) = crowded shorts = contrarian UP
    - Moderate funding = slight bias in opposite direction
    
    Returns: (bias, confidence)
    - bias: "UP", "DOWN", or "NEUTRAL"
    - confidence: 0.0 to 1.0
    """
    extreme = CONFIG['funding_extreme_threshold']
    
    if funding_rate > extreme:  # > 1%
        # Very crowded longs - expect reversal down
        confidence = min(0.55 + (funding_rate - extreme) * 2, 0.65)
        return "DOWN", confidence
    elif funding_rate < -extreme:  # < -1%
        # Very crowded shorts - expect reversal up
        confidence = min(0.55 + (abs(funding_rate) - extreme) * 2, 0.65)
        return "UP", confidence
    elif funding_rate > 0.0001:  # Slight positive
        return "DOWN", 0.52
    elif funding_rate < -0.0001:  # Slight negative
        return "UP", 0.52
    else:
        return "NEUTRAL", 0.50


def get_order_flow_signal(trades: list) -> Tuple[str, float]:
    """
    Generate signal from order flow (volume delta).
    
    Analyzes recent trades to detect informed buying/selling pressure.
    
    Returns: (signal, strength)
    - signal: "UP", "DOWN", or "NEUTRAL"
    - strength: 0.0 to 1.0
    """
    if not trades or len(trades) < 10:
        return "NEUTRAL", 0.0
    
    # Calculate volume delta
    # is_buyer_maker=False means buyer is taker (aggressive buying)
    # is_buyer_maker=True means seller is taker (aggressive selling)
    buy_volume = sum(t['qty'] for t in trades if not t.get('is_buyer_maker', True))
    sell_volume = sum(t['qty'] for t in trades if t.get('is_buyer_maker', True))
    
    total_volume = buy_volume + sell_volume
    if total_volume == 0:
        return "NEUTRAL", 0.0
    
    volume_delta = buy_volume - sell_volume
    delta_ratio = volume_delta / total_volume
    
    threshold = CONFIG['volume_delta_threshold']
    
    if delta_ratio > threshold:
        # Strong buying pressure
        strength = min(abs(delta_ratio) * 1.5, 0.7)
        return "UP", strength
    elif delta_ratio < -threshold:
        # Strong selling pressure
        strength = min(abs(delta_ratio) * 1.5, 0.7)
        return "DOWN", strength
    else:
        return "NEUTRAL", abs(delta_ratio)


# ============================================================================
# Main Signal Generation
# ============================================================================

class SignalGenerator:
    """Main signal generator combining all components."""
    
    def __init__(self):
        self.data_feed = MarketDataFeed()
        self.last_signal_time = 0
        self.signal_cooldown = 30  # seconds between signals
    
    def generate_signal(self) -> Dict[str, Any]:
        """
        Generate comprehensive trading signal.
        
        Returns dict with:
        - signal: "UP", "DOWN", "NEUTRAL", or None
        - confidence: 0.0 to 1.0
        - side: "yes" (for UP) or "no" (for DOWN)
        - position_size: recommended position size
        - reason: explanation string
        - metadata: detailed signal components
        """
        result = {
            'signal': None,
            'side': None,
            'confidence': 0.0,
            'position_size': 0.0,
            'reason': '',
            'metadata': {}
        }
        
        # Cooldown check
        if time.time() - self.last_signal_time < self.signal_cooldown:
            result['reason'] = 'Signal cooldown active'
            return result
        
        # 1. Get current price and update history
        current_price = self.data_feed.fetch_binance_price()
        if current_price == 0:
            result['reason'] = 'Failed to fetch price'
            return result
        
        # 2. Calculate volatility
        prices = self.data_feed.get_price_history(minutes=15)
        atr = calculate_atr(prices, period=CONFIG['atr_period'])
        regime, vol_mult = get_volatility_regime(current_price, atr)
        
        result['metadata']['price'] = current_price
        result['metadata']['atr'] = atr
        result['metadata']['volatility_regime'] = regime
        result['metadata']['volatility_multiplier'] = vol_mult
        
        # Volatility filter - skip low vol periods
        if regime == "LOW":
            result['reason'] = f'Volatility too low (ATR: {atr/current_price*100:.3f}%)'
            return result
        
        # 3. Get funding rate signal
        funding_rate, funding_source = self.data_feed.fetch_funding_rate()
        funding_bias, funding_conf = get_funding_signal(funding_rate)
        
        result['metadata']['funding_rate'] = funding_rate
        result['metadata']['funding_source'] = funding_source
        result['metadata']['funding_bias'] = funding_bias
        result['metadata']['funding_confidence'] = funding_conf
        
        # 4. Get order flow signal
        recent_trades = self.data_feed.fetch_recent_trades()
        flow_signal, flow_strength = get_order_flow_signal(recent_trades)
        
        result['metadata']['order_flow_signal'] = flow_signal
        result['metadata']['order_flow_strength'] = flow_strength
        result['metadata']['recent_trade_count'] = len(recent_trades)
        
        # 5. Combine signals with weighted consensus
        up_score = 0.0
        down_score = 0.0
        
        # Funding rate signal (weight: 40%)
        if funding_bias == "UP":
            up_score += funding_conf * 0.4
        elif funding_bias == "DOWN":
            down_score += funding_conf * 0.4
        
        # Order flow signal (weight: 60%)
        if flow_signal == "UP":
            up_score += flow_strength * 0.6
        elif flow_signal == "DOWN":
            down_score += flow_strength * 0.6
        
        # Determine consensus
        if up_score > down_score:
            signal = "UP"
            confidence = up_score
        elif down_score > up_score:
            signal = "DOWN"
            confidence = down_score
        else:
            result['reason'] = f'No consensus (UP: {up_score:.2f}, DOWN: {down_score:.2f})'
            return result
        
        # 6. Apply minimum confidence threshold
        if confidence < CONFIG['min_confidence']:
            result['reason'] = f'Confidence {confidence:.2f} below threshold {CONFIG["min_confidence"]}'
            return result
        
        # 7. Boost confidence in high volatility
        if regime == "HIGH":
            confidence = min(confidence * 1.15, 0.75)
        
        # 8. Check for conflicting signals (reduce confidence)
        if funding_bias != signal and funding_bias != "NEUTRAL":
            # Funding disagrees with flow - reduce confidence
            confidence *= 0.85
            conflict_note = " (funding conflicts)"
        else:
            conflict_note = ""
        
        # 9. Final confidence check after adjustments
        if confidence < CONFIG['min_confidence']:
            result['reason'] = f'Adjusted confidence {confidence:.2f} too low{conflict_note}'
            return result
        
        # 10. Calculate position size
        position_size = self.calculate_position_size(confidence, regime)
        
        # Populate result
        result['signal'] = signal
        result['side'] = 'yes' if signal == 'UP' else 'no'
        result['confidence'] = confidence
        result['position_size'] = position_size
        result['reason'] = f'{signal} consensus: funding={funding_bias} ({funding_conf:.2f}), flow={flow_signal} ({flow_strength:.2f}){conflict_note}'
        
        self.last_signal_time = time.time()
        return result
    
    def calculate_position_size(self, confidence: float, regime: str) -> float:
        """
        Calculate position size using Kelly criterion principles.
        """
        # Convert confidence to win rate estimate
        # Confidence 0.45 -> 50% win rate
        # Confidence 0.55 -> 55% win rate
        # Confidence 0.65 -> 60% win rate
        win_rate = 0.50 + (confidence - CONFIG['min_confidence']) * 2
        
        # Kelly edge calculation
        # For binary outcome at even odds: edge = 2p - 1
        edge = (2 * win_rate) - 1
        
        if edge <= 0:
            return 0
        
        # Conservative Kelly: use 30% of full Kelly
        kelly_fraction = edge * 0.30
        
        # Volatility multiplier
        if regime == "HIGH":
            vol_mult = 1.5
        elif regime == "NORMAL":
            vol_mult = 1.0
        else:
            vol_mult = 0.5
        
        # Calculate position
        base = CONFIG['base_position_size']
        position = base * (1 + kelly_fraction) * vol_mult
        
        return min(position, CONFIG['max_position_size'])


# ============================================================================
# Risk Manager
# ============================================================================

class RiskManager:
    """Risk management and circuit breakers."""
    
    def __init__(self, state_file: str = ".strategy_state.json"):
        self.state_file = state_file
        self.daily_pnl = 0.0
        self.trades_today = 0
        self.hourly_trades = 0
        self.hour_start = datetime.now(timezone.utc).hour
        self.consecutive_losses = 0
        self.last_trade_time = 0
        
        self.load_state()
    
    def load_state(self):
        """Load persisted state."""
        try:
            with open(self.state_file, 'r') as f:
                state = json.load(f)
                today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
                if state.get('date') == today:
                    self.daily_pnl = state.get('daily_pnl', 0)
                    self.trades_today = state.get('trades_today', 0)
                    self.consecutive_losses = state.get('consecutive_losses', 0)
        except:
            pass
    
    def save_state(self):
        """Persist state to file."""
        state = {
            'date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
            'daily_pnl': self.daily_pnl,
            'trades_today': self.trades_today,
            'consecutive_losses': self.consecutive_losses,
            'last_updated': time.time()
        }
        try:
            with open(self.state_file, 'w') as f:
                json.dump(state, f)
        except Exception as e:
            print(f"Error saving state: {e}")
    
    def can_trade(self) -> Tuple[bool, str]:
        """
        Check if trading is allowed based on risk rules.
        
        Returns: (allowed, reason)
        """
        # Check daily loss limit
        if self.daily_pnl <= -CONFIG['daily_loss_limit']:
            return False, f"Daily loss limit reached: ${self.daily_pnl:.2f}"
        
        # Check hourly trade limit
        current_hour = datetime.now(timezone.utc).hour
        if current_hour != self.hour_start:
            self.hour_start = current_hour
            self.hourly_trades = 0
        
        if self.hourly_trades >= CONFIG['max_trades_per_hour']:
            return False, f"Hourly trade limit reached: {self.hourly_trades}"
        
        # Check consecutive losses
        if self.consecutive_losses >= CONFIG['max_consecutive_losses']:
            return False, f"Circuit breaker: {self.consecutive_losses} consecutive losses"
        
        return True, "OK"
    
    def record_trade(self, side: str, amount: float, result: dict):
        """Record trade outcome for risk tracking."""
        self.trades_today += 1
        self.hourly_trades += 1
        self.last_trade_time = time.time()
        
        # Calculate P&L if available
        pnl = result.get('pnl', 0)
        self.daily_pnl += pnl
        
        if pnl < 0:
            self.consecutive_losses += 1
        else:
            self.consecutive_losses = 0
        
        self.save_state()
    
    def get_status(self) -> dict:
        """Get current risk status."""
        return {
            'daily_pnl': self.daily_pnl,
            'trades_today': self.trades_today,
            'hourly_trades': self.hourly_trades,
            'consecutive_losses': self.consecutive_losses,
            'can_trade': self.can_trade()[0]
        }


# ============================================================================
# Integration Helper
# ============================================================================

def get_trading_decision() -> Optional[Dict[str, Any]]:
    """
    Main entry point for getting trading decision.
    
    Returns trade decision dict or None if no trade.
    """
    # Initialize components
    signal_gen = SignalGenerator()
    risk_mgr = RiskManager()
    
    # Check risk limits first
    allowed, reason = risk_mgr.can_trade()
    if not allowed:
        print(f"Risk check failed: {reason}")
        return None
    
    # Generate signal
    signal = signal_gen.generate_signal()
    
    if signal['signal'] is None:
        print(f"No signal: {signal['reason']}")
        return None
    
    # Return trade decision
    return {
        'side': signal['side'],
        'amount': signal['position_size'],
        'confidence': signal['confidence'],
        'reason': signal['reason'],
        'metadata': signal['metadata'],
        'risk_status': risk_mgr.get_status()
    }


# ============================================================================
# Test / Debug
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Winning Strategy Signal Generator - Test Mode")
    print("=" * 60)
    
    signal_gen = SignalGenerator()
    risk_mgr = RiskManager()
    
    print("\nRisk Status:")
    status = risk_mgr.get_status()
    for k, v in status.items():
        print(f"  {k}: {v}")
    
    print("\nGenerating signal...")
    result = signal_gen.generate_signal()
    
    print(f"\nSignal Result:")
    print(f"  Signal: {result['signal']}")
    print(f"  Side: {result['side']}")
    print(f"  Confidence: {result['confidence']:.3f}")
    print(f"  Position Size: ${result['position_size']:.2f}")
    print(f"  Reason: {result['reason']}")
    
    print(f"\nMetadata:")
    for k, v in result['metadata'].items():
        print(f"  {k}: {v}")
    
    print("\n" + "=" * 60)
