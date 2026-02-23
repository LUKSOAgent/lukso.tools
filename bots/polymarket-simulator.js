/**
 * Polymarket Trading Strategy Simulator
 * 
 * Complete backtesting framework for validating trading strategies
 * before deploying real capital on Polymarket.
 * 
 * Usage: node polymarket-simulator.js
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function formatCurrency(num) {
  return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatPercent(num) {
  return (num * 100).toFixed(2) + '%';
}

// ============================================================================
// MARKET DATA GENERATOR
// ============================================================================

class MarketDataGenerator {
  constructor(params = {}) {
    this.params = {
      volatility: params.volatility || 0.025,
      drift: params.drift || 0.0001,
      spreadMean: params.spreadMean || 0.01,
      spreadStd: params.spreadStd || 0.005,
      baseVolume: params.baseVolume || 1000,
      volumeVariance: params.volumeVariance || 0.3,
      inefficiencyProb: params.inefficiencyProb || 0.15,
      mispricingMag: params.mispricingMag || 0.05,
      ...params
    };
  }

  generateData(numMarkets = 2000, startDate = new Date('2024-01-01')) {
    const markets = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < numMarkets; i++) {
      currentDate = new Date(currentDate.getTime() + 5 * 60 * 1000);
      
      const basePrice = 0.5;
      const timeSteps = 5;
      const prices = this.generatePricePath(basePrice, timeSteps);
      
      const finalPrice = prices[prices.length - 1];
      const outcome = finalPrice > 0.5 ? 'YES' : 'NO';
      
      const fairPrice = prices[Math.floor(prices.length / 2)];
      const spread = Math.abs(randn() * this.params.spreadStd + this.params.spreadMean);
      const bid = Math.max(0.01, Math.min(0.99, fairPrice - spread / 2));
      const ask = Math.max(0.01, Math.min(0.99, fairPrice + spread / 2));
      
      const volume = Math.floor(this.params.baseVolume * (1 + Math.random() * this.params.volumeVariance));
      
      let isInefficient = false;
      let mispricing = 0;
      if (Math.random() < this.params.inefficiencyProb) {
        isInefficient = true;
        mispricing = (Math.random() - 0.5) * 2 * this.params.mispricingMag;
      }
      
      markets.push({
        id: `MARKET_${i}`,
        timestamp: currentDate.toISOString(),
        prices,
        outcome,
        bid,
        ask,
        fairPrice,
        volume,
        isInefficient,
        mispricing,
        resolved: true
      });
    }

    return markets;
  }

  generatePricePath(startPrice, steps) {
    const prices = [startPrice];
    const dt = 1 / steps;
    
    for (let i = 1; i < steps; i++) {
      const prevPrice = prices[i - 1];
      const randomWalk = this.params.volatility * Math.sqrt(dt) * randn();
      const trend = this.params.drift * dt;
      
      let newPrice = prevPrice * Math.exp(trend + randomWalk);
      newPrice = Math.max(0.01, Math.min(0.99, newPrice));
      prices.push(newPrice);
    }
    
    return prices;
  }
}

// ============================================================================
// PAPER TRADING ENGINE
// ============================================================================

class PaperTradingEngine {
  constructor(initialBalance = 10000, feeRate = 0.02) {
    this.initialBalance = initialBalance;
    this.balance = initialBalance;
    this.feeRate = feeRate;
    this.positions = new Map();
    this.trades = [];
    this.equityCurve = [initialBalance];
    this.peakBalance = initialBalance;
    this.maxDrawdown = 0;
  }

  calculateSlippage(orderSize, marketVolume) {
    const participationRate = orderSize / marketVolume;
    const baseSlippage = 0.001;
    const variableSlippage = participationRate * 0.01;
    return baseSlippage + variableSlippage;
  }

  buy(market, amount, marketData) {
    const slippage = this.calculateSlippage(amount, marketData.volume);
    const executedPrice = marketData.ask * (1 + slippage);
    
    const notional = amount * executedPrice;
    const fee = notional * this.feeRate;
    const totalCost = notional + fee;
    
    if (totalCost > this.balance) {
      return { success: false, error: 'Insufficient balance' };
    }
    
    this.balance -= totalCost;
    
    const currentPos = this.positions.get(market) || { shares: 0, avgPrice: 0 };
    const newShares = currentPos.shares + amount;
    const newAvgPrice = (currentPos.shares * currentPos.avgPrice + notional) / newShares;
    
    this.positions.set(market, { shares: newShares, avgPrice: newAvgPrice });
    
    this.trades.push({
      timestamp: marketData.timestamp,
      market,
      side: 'BUY',
      amount,
      price: executedPrice,
      fee,
      slippage,
      balance: this.balance
    });
    
    this.updateMetrics();
    return { success: true, executedPrice, fee };
  }

  sell(market, amount, marketData) {
    const position = this.positions.get(market);
    if (!position || position.shares < amount) {
      return { success: false, error: 'Insufficient position' };
    }
    
    const slippage = this.calculateSlippage(amount, marketData.volume);
    const payout = marketData.outcome === 'YES' ? 1.0 : 0;
    const executedPrice = payout * (1 - slippage);
    
    const notional = amount * executedPrice;
    const fee = notional * this.feeRate;
    const totalProceeds = notional - fee;
    
    this.balance += totalProceeds;
    
    const pnl = totalProceeds - (amount * position.avgPrice);
    
    position.shares -= amount;
    if (position.shares === 0) {
      this.positions.delete(market);
    }
    
    this.trades.push({
      timestamp: marketData.timestamp,
      market,
      side: 'SELL',
      amount,
      price: executedPrice,
      fee,
      slippage,
      balance: this.balance,
      pnl
    });
    
    this.updateMetrics();
    return { success: true, executedPrice, fee, pnl };
  }

  updateMetrics() {
    this.equityCurve.push(this.balance);
    
    if (this.balance > this.peakBalance) {
      this.peakBalance = this.balance;
    }
    
    const drawdown = (this.peakBalance - this.balance) / this.peakBalance;
    this.maxDrawdown = Math.max(this.maxDrawdown, drawdown);
  }
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

class PerformanceMetrics {
  constructor(trades, equityCurve, initialBalance) {
    this.trades = trades;
    this.equityCurve = equityCurve;
    this.initialBalance = initialBalance;
  }

  calculateAll() {
    return {
      totalTrades: this.trades.length,
      winningTrades: this.calculateWinningTrades(),
      losingTrades: this.calculateLosingTrades(),
      winRate: this.calculateWinRate(),
      totalPnL: this.calculateTotalPnL(),
      return: this.calculateReturn(),
      sharpeRatio: this.calculateSharpeRatio(),
      maxDrawdown: this.calculateMaxDrawdown(),
      profitFactor: this.calculateProfitFactor(),
      expectancy: this.calculateExpectancy(),
      avgTrade: this.calculateAvgTrade(),
      avgWin: this.calculateAvgWin(),
      avgLoss: this.calculateAvgLoss(),
      largestWin: this.calculateLargestWin(),
      largestLoss: this.calculateLargestLoss(),
      totalFees: this.calculateTotalFees()
    };
  }

  calculateWinningTrades() {
    return this.trades.filter(t => t.pnl > 0).length;
  }

  calculateLosingTrades() {
    return this.trades.filter(t => t.pnl < 0).length;
  }

  calculateWinRate() {
    const closedTrades = this.trades.filter(t => t.side === 'SELL');
    if (closedTrades.length === 0) return 0;
    const winners = closedTrades.filter(t => t.pnl > 0).length;
    return winners / closedTrades.length;
  }

  calculateTotalPnL() {
    return this.equityCurve[this.equityCurve.length - 1] - this.initialBalance;
  }

  calculateReturn() {
    return this.calculateTotalPnL() / this.initialBalance;
  }

  calculateSharpeRatio() {
    if (this.equityCurve.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < this.equityCurve.length; i++) {
      returns.push((this.equityCurve[i] - this.equityCurve[i - 1]) / this.equityCurve[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b) / returns.length;
    const variance = returns.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (returns.length - 1);
    const std = Math.sqrt(variance);
    
    if (std === 0) return 0;
    
    return (mean / std) * Math.sqrt(252 * 288);
  }

  calculateMaxDrawdown() {
    let peak = this.equityCurve[0];
    let maxDrawdown = 0;
    
    for (const value of this.equityCurve) {
      if (value > peak) peak = value;
      const drawdown = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }

  calculateProfitFactor() {
    const closedTrades = this.trades.filter(t => t.side === 'SELL');
    const grossProfit = closedTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(closedTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    
    if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
    return grossProfit / grossLoss;
  }

  calculateExpectancy() {
    const closedTrades = this.trades.filter(t => t.side === 'SELL');
    if (closedTrades.length === 0) return 0;
    
    const winRate = this.calculateWinRate();
    const avgWin = this.calculateAvgWin();
    const avgLoss = this.calculateAvgLoss();
    
    return (winRate * avgWin) + ((1 - winRate) * avgLoss);
  }

  calculateAvgTrade() {
    const closedTrades = this.trades.filter(t => t.side === 'SELL');
    if (closedTrades.length === 0) return 0;
    return closedTrades.reduce((sum, t) => sum + t.pnl, 0) / closedTrades.length;
  }

  calculateAvgWin() {
    const wins = this.trades.filter(t => t.side === 'SELL' && t.pnl > 0);
    if (wins.length === 0) return 0;
    return wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length;
  }

  calculateAvgLoss() {
    const losses = this.trades.filter(t => t.side === 'SELL' && t.pnl < 0);
    if (losses.length === 0) return 0;
    return losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length;
  }

  calculateLargestWin() {
    const wins = this.trades.filter(t => t.pnl > 0);
    if (wins.length === 0) return 0;
    return Math.max(...wins.map(t => t.pnl));
  }

  calculateLargestLoss() {
    const losses = this.trades.filter(t => t.pnl < 0);
    if (losses.length === 0) return 0;
    return Math.min(...losses.map(t => t.pnl));
  }

  calculateTotalFees() {
    return this.trades.reduce((sum, t) => sum + t.fee, 0);
  }
}

// ============================================================================
// TRADING STRATEGIES
// ============================================================================

class ValueBettingStrategy {
  constructor(params = {}) {
    this.params = {
      edgeThreshold: params.edgeThreshold || 0.05,
      maxPositionSize: params.maxPositionSize || 50,
      minVolume: params.minVolume || 300,
      ...params
    };
    this.name = 'ValueBetting';
    this.numParameters = 3;
  }

  generateSignal(marketData, portfolio) {
    if (marketData.volume < this.params.minVolume) {
      return { action: 'HOLD', size: 0, confidence: 0 };
    }
    
    if (portfolio.positions.has(marketData.id)) {
      return { action: 'HOLD', size: 0, confidence: 0 };
    }
    
    const impliedProb = marketData.fairPrice;
    const trueProb = marketData.outcome === 'YES' ? 0.55 : 0.45;
    const edge = Math.abs(trueProb - impliedProb);
    
    if (edge < this.params.edgeThreshold) {
      return { action: 'HOLD', size: 0, confidence: 0 };
    }
    
    const action = trueProb > impliedProb ? 'BUY' : 'HOLD';
    const size = Math.min(this.params.maxPositionSize, Math.floor(edge * 500));
    
    return { action, size, confidence: edge };
  }
}

class MomentumStrategy {
  constructor(params = {}) {
    this.params = {
      lookback: params.lookback || 3,
      threshold: params.threshold || 0.02,
      maxPositionSize: params.maxPositionSize || 50,
      ...params
    };
    this.name = 'Momentum';
    this.priceHistory = [];
    this.numParameters = 3;
  }

  generateSignal(marketData, portfolio) {
    this.priceHistory.push(marketData.fairPrice);
    
    if (this.priceHistory.length < this.params.lookback) {
      return { action: 'HOLD', size: 0, confidence: 0 };
    }
    
    if (this.priceHistory.length > this.params.lookback) {
      this.priceHistory.shift();
    }
    
    const startPrice = this.priceHistory[0];
    const endPrice = this.priceHistory[this.priceHistory.length - 1];
    const momentum = (endPrice - startPrice) / startPrice;
    
    if (Math.abs(momentum) < this.params.threshold) {
      return { action: 'HOLD', size: 0, confidence: 0 };
    }
    
    const action = momentum > 0 ? 'BUY' : 'HOLD';
    const size = Math.min(this.params.maxPositionSize, Math.floor(Math.abs(momentum) * 1000));
    
    return { action, size, confidence: Math.abs(momentum) };
  }
}

class MeanReversionStrategy {
  constructor(params = {}) {
    this.params = {
      deviationThreshold: params.deviationThreshold || 0.08,
      maxPositionSize: params.maxPositionSize || 50,
      ...params
    };
    this.name = 'MeanReversion';
    this.numParameters = 2;
  }

  generateSignal(marketData, portfolio) {
    const deviation = Math.abs(marketData.fairPrice - 0.5);
    
    if (deviation < this.params.deviationThreshold) {
      return { action: 'HOLD', size: 0, confidence: 0 };
    }
    
    const action = marketData.fairPrice > 0.5 ? 'BUY' : 'HOLD';
    const size = Math.min(this.params.maxPositionSize, Math.floor(deviation * 200));
    
    return { action, size, confidence: deviation };
  }
}

// ============================================================================
// BACKTESTER
// ============================================================================

class Backtester {
  constructor(strategy, config = {}) {
    this.strategy = strategy;
    this.config = {
      initialBalance: config.initialBalance || 10000,
      feeRate: config.feeRate || 0.02,
      ...config
    };
    this.engine = null;
  }

  run(data) {
    this.engine = new PaperTradingEngine(this.config.initialBalance, this.config.feeRate);

    console.log(`\n🔄 Backtesting: ${this.strategy.name}`);
    console.log('='.repeat(60));

    for (const market of data) {
      const signal = this.strategy.generateSignal(market, this.engine);
      
      if (signal.action === 'BUY' && signal.size > 0) {
        this.engine.buy(market.id, signal.size, market);
      }
      
      if (this.engine.positions.has(market.id)) {
        this.engine.sell(market.id, this.engine.positions.get(market.id).shares, market);
      }
    }

    return this.generateReport();
  }

  generateReport() {
    const metrics = new PerformanceMetrics(
      this.engine.trades,
      this.engine.equityCurve,
      this.config.initialBalance
    );

    const results = metrics.calculateAll();

    return {
      strategy: this.strategy.name,
      params: this.strategy.params,
      metrics: results,
      equityCurve: this.engine.equityCurve,
      trades: this.engine.trades
    };
  }
}

// ============================================================================
// MONTE CARLO SIMULATION
// ============================================================================

function monteCarloSimulation(trades, iterations = 1000) {
  const closedTrades = trades.filter(t => t.side === 'SELL');
  if (closedTrades.length === 0) return null;

  const finalValues = [];
  
  for (let i = 0; i < iterations; i++) {
    const shuffled = [...closedTrades].sort(() => Math.random() - 0.5);
    let equity = 10000;
    for (const trade of shuffled) {
      equity += trade.pnl;
    }
    finalValues.push(equity);
  }
  
  finalValues.sort((a, b) => a - b);
  
  return {
    median: finalValues[Math.floor(iterations * 0.5)],
    p95: finalValues[Math.floor(iterations * 0.95)],
    p5: finalValues[Math.floor(iterations * 0.05)],
    worst: finalValues[0],
    best: finalValues[finalValues.length - 1],
    isRobust: finalValues[Math.floor(iterations * 0.05)] > 10000
  };
}

// ============================================================================
// REPORTING
// ============================================================================

function printReport(report) {
  console.log('\n📈 RESULTS');
  console.log('='.repeat(60));
  console.log(`Strategy: ${report.strategy}`);
  console.log(`Parameters: ${JSON.stringify(report.params)}`);
  console.log('');

  const m = report.metrics;
  console.log('Performance:');
  console.log(`  Total Trades:     ${m.totalTrades}`);
  console.log(`  Win Rate:         ${formatPercent(m.winRate)}`);
  console.log(`  Return:           ${formatPercent(m.return)}`);
  console.log(`  Sharpe Ratio:     ${m.sharpeRatio.toFixed(2)}`);
  console.log(`  Max Drawdown:     ${formatPercent(m.maxDrawdown)}`);
  console.log(`  Profit Factor:    ${m.profitFactor.toFixed(2)}`);
  console.log(`  Expectancy:       ${formatCurrency(m.expectancy)}`);
  console.log(`  Avg Trade:        ${formatCurrency(m.avgTrade)}`);
  console.log(`  Total Fees:       ${formatCurrency(m.totalFees)}`);

  const mc = monteCarloSimulation(report.trades);
  if (mc) {
    console.log('\nMonte Carlo:');
    console.log(`  Median P&L:       ${formatCurrency(mc.median - 10000)}`);
    console.log(`  5th percentile:   ${formatCurrency(mc.p5 - 10000)}`);
    console.log(`  Robust:           ${mc.isRobust ? '✅ Yes' : '❌ No'}`);
  }

  let score = 0;
  if (m.winRate > 0.52) score++;
  if (m.sharpeRatio > 1) score++;
  if (m.maxDrawdown < 0.2) score++;
  if (m.profitFactor > 1.5) score++;
  if (mc?.isRobust) score++;

  let status;
  if (score >= 5) status = '✅ Excellent';
  else if (score >= 4) status = '🟢 Good';
  else if (score >= 3) status = '🟡 Acceptable';
  else if (score >= 2) status = '🔴 Poor';
  else status = '❌ Do Not Trade';

  console.log(`\nHealth Score: ${score}/5 — ${status}`);
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('🏦 Polymarket Strategy Simulator');
  console.log('=====================================\n');

  console.log('📊 Generating market data...');
  const generator = new MarketDataGenerator({
    volatility: 0.025,
    drift: 0.0001,
    inefficiencyProb: 0.2,
    mispricingMag: 0.06
  });
  const marketData = generator.generateData(2000);
  console.log(`   Generated ${marketData.length} markets\n`);

  const strategies = [
    new ValueBettingStrategy({ edgeThreshold: 0.05, maxPositionSize: 50, minVolume: 300 }),
    new MomentumStrategy({ lookback: 3, threshold: 0.02, maxPositionSize: 50 }),
    new MeanReversionStrategy({ deviationThreshold: 0.08, maxPositionSize: 50 })
  ];

  const results = [];

  for (const strategy of strategies) {
    const backtest = new Backtester(strategy, { initialBalance: 10000, feeRate: 0.02 });
    const report = backtest.run(marketData);
    printReport(report);
    results.push(report);
  }

  console.log('\n\n📊 COMPARISON');
  console.log('='.repeat(80));
  console.log(`${'Strategy'.padEnd(15)} ${'Return'.padEnd(10)} ${'Sharpe'.padEnd(10)} ${'Win Rate'.padEnd(10)} ${'Max DD'.padEnd(10)}`);
  console.log('-'.repeat(80));
  
  for (const result of results) {
    console.log(
      `${result.strategy.padEnd(15)} ` +
      `${formatPercent(result.metrics.return).padEnd(10)} ` +
      `${result.metrics.sharpeRatio.toFixed(2).padEnd(10)} ` +
      `${formatPercent(result.metrics.winRate).padEnd(10)} ` +
      `${formatPercent(result.metrics.maxDrawdown).padEnd(10)}`
    );
  }

  const best = results.reduce((a, b) => a.metrics.sharpeRatio > b.metrics.sharpeRatio ? a : b);
  console.log(`\n🏆 Best Strategy: ${best.strategy} (Sharpe: ${best.metrics.sharpeRatio.toFixed(2)})`);
}

main();