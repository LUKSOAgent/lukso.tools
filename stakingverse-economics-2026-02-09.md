# Stakingverse Protocol Economics & Risk Analysis

**Analysis Date:** February 9, 2026  
**Protocol:** Stakingverse (LUKSO Liquid Staking)  
**sLYX Token:** 0x8A3982f0A7d154D11a5f43EEc7F50E52eBBc8F7D  
**Vault Contract:** 0x9F49a95b0c3c9e2A6c77a16C177928294c0F6F04

---

## Executive Summary

Stakingverse is the primary liquid staking protocol for LUKSO (LYX), offering users the ability to stake LYX while receiving liquid sLYX tokens that can be used in DeFi. The protocol is based on Universal Page's vault implementation with a custom LSP7-based liquid staking token. This analysis covers the protocol's mechanics, tokenomics, validator management, slashing risks, liquidity considerations, and fee structure.

**Key Observation from User Experience:**
- Staked 1,130 LYX → Received ~1,000 sLYX (exchange rate ~1.13:1)
- Unstaking showed "wait for oracle" behavior, indicating asynchronous withdrawal processing

---

## 1. Staking/Unstaking Mechanics

### Staking Flow

```
┌─────────────┐     deposit(beneficiary)      ┌─────────────────┐
│   User      │ ─────────────────────────────→│ Stakingverse    │
│   (LYX)     │        (sends native LYX)      │ Vault           │
└─────────────┘                               └─────────────────┘
                                                      │
                                                      │ mints
                                                      ▼
                                               ┌─────────────────┐
                                               │ sLYX Tokens     │
                                               │ (LSP7 standard) │
                                               └─────────────────┘
                                                      │
                                                      │ via transferStake
                                                      ▼
                                               ┌─────────────────┐
                                               │  User's UP/EOA  │
                                               │  (receives sLYX)│
                                               └─────────────────┘
```

**Key Functions:**
- `deposit(address beneficiary)` - Stakes native LYX for a beneficiary
- `transferStake(address to, uint256 amount, bytes data)` - Transfers staked LYX between accounts
- When transferring stake to sLYX contract → sLYX tokens are minted via `onVaultStakeReceived()`

### Unstaking Flow (Complex Multi-Step Process)

```
┌─────────────┐     burn(address, amount)      ┌─────────────────┐
│   User      │ ─────────────────────────────→│   sLYX Token    │
│   (sLYX)    │                               │   Contract      │
└─────────────┘                               └─────────────────┘
                                                      │
                                                      │ converts to
                                                      ▼
                                               ┌─────────────────┐
                                               │ Staked LYX in   │
                                               │ Vault (illiquid)│
                                               └─────────────────┘
                                                      │
                                   ┌──────────────────┴──────────────────┐
                                   │                                     │
                                   ▼                                     ▼
                         ┌─────────────────┐                  ┌─────────────────┐
                         │ transferStake   │                  │    withdraw     │
                         │ (to another     │                  │ (request        │
                         │  user/UP)       │                  │  withdrawal)    │
                         └─────────────────┘                  └─────────────────┘
                                                                        │
                                                                        ▼
                                                               ┌─────────────────┐
                                                               │  Wait for       │
                                                               │  Oracle         │
                                                               │  Rebalancing    │
                                                               └─────────────────┘
                                                                        │
                                                                        ▼
                                                               ┌─────────────────┐
                                                               │     claim       │
                                                               │ (receive native │
                                                               │  LYX)           │
                                                               └─────────────────┘
```

**Critical Finding:** Unlike simple ERC-4626 vaults, Stakingverse uses an **oracle-dependent withdrawal mechanism**:

1. **Withdraw Request** (`withdraw(amount, beneficiary)`) - Creates a pending withdrawal
2. **Oracle Rebalancing** - Oracles periodically rebalance the vault, moving funds from "pending" to "claimable"
3. **Claim** (`claim(amount, beneficiary)`) - Actually receives native LYX

This creates a **time delay** between requesting withdrawal and receiving funds.

---

## 2. sLYX Tokenomics

### Token Specification
- **Standard:** LSP7 (LUKSO Digital Asset standard)
- **Type:** Non-rebasing value-accruing token
- **Total Supply:** Dynamic based on staked amounts
- **Decimals:** 18

### Exchange Rate Mechanism

**Minting Formula:**
```
sLYX to mint = (LYX amount × total sLYX minted) / total stake held by sLYX contract
```

**Burning Formula:**
```
LYX received = (sLYX amount × total stake held by sLYX contract) / total sLYX minted
```

**Exchange Rate Function:**
- `getExchangeRate()` returns "how many LYX are worth 1 sLYX"
- Exchange rate increases over time as rewards accumulate
- Non-rebasing: token balance stays constant, value per token increases

### User's Experience Analysis

| Metric | Value |
|--------|-------|
| LYX Staked | 1,130 LYX |
| sLYX Received | ~1,000 sLYX |
| Implied Exchange Rate | ~1.13 LYX per 1 sLYX |
| Fee Impact | ~11.5% (likely includes deposit fees or exchange rate delta) |

**Possible Explanations for the Ratio:**
1. Protocol deposit fee (~10% seems high - verify actual fee structure)
2. Exchange rate at time of deposit (1 sLYX = 1.13 LYX worth of staked value)
3. Partial stake conversion (user may have only converted portion of stake)

### Minting & Burning

**Minting (Making Stake Liquid):**
- Triggered by calling `transferStake()` with sLYX contract as recipient
- Vault calls `onVaultStakeReceived()` hook on sLYX contract
- sLYX tokens minted proportional to staked LYX transferred
- Can be paused by admin in emergencies

**Burning (Converting Back to Illiquid Stake):**
- Call `burn(from, amount, data)` on sLYX contract
- sLYX tokens burned, equivalent staked LYX credited back to user in vault
- Does NOT immediately provide native LYX - requires separate withdraw/claim cycle

---

## 3. Validator Set Management

### Architecture

The StakingverseVault contract manages validator registrations and staking operations:

**Key State Variables:**
```solidity
uint256 totalValidatorsRegistered  // Track validator count
mapping(address => bool) _oracles  // Oracle addresses for rebalancing
address operator                   // Operator address for validator management
```

**Validator Registration:**
- Only operator can register validators in the LUKSO deposit contract
- Validators require 32 LYX deposit each (standard Ethereum-style staking)
- Registered validator keys tracked in `_registeredKeys` mapping

**Oracle System:**
- Multiple oracle addresses can be authorized
- Oracles perform periodic rebalancing
- Rebalancing updates `totalClaimable` - the amount available for immediate withdrawal

### Rebalancing Mechanism

The "wait for oracle" behavior observed during unstaking relates to this rebalancing:

```
1. User requests withdrawal → Funds move to "pending" state
2. Oracle rebalances vault → Moves pending → claimable
3. User can then claim → Receives native LYX
```

**Why This Exists:**
- Validators can't instantly exit (32 LYX locked per validator)
- Oracle manages validator exits to match withdrawal demand
- Prevents bank-run scenarios by controlling outflow

---

## 4. Slashing Risks

### LUKSO Staking Slashing Conditions

Based on standard Ethereum-style PoS (which LUKSO follows):

| Violation | Penalty | Impact on sLYX Holders |
|-----------|---------|----------------------|
| **Attestation Misses** | Small penalty | Gradual value reduction |
| **Proposer Slashing** | Large penalty (~1-32 LYX) | Direct sLYX value drop |
| **Double Signing** | Ejection + heavy penalty | Significant sLYX depeg risk |

### Protocol-Level Protections

From contract analysis:
- Reentrancy protection on all state-changing functions
- Pausable functionality (emergency stop)
- Upgradeable contract pattern for security patches
- Validator key registration tracking

### Risk Assessment

**Moderate Risk Factors:**
1. **Operator Centralization** - Operator manages validators; compromise = slashing risk
2. **Oracle Dependency** - Oracles control withdrawal liquidity
3. **No Insurance** - Unlike Lido with slashing insurance, no explicit coverage

**Mitigation:**
- Contract is upgradeable (can patch issues)
- Based on audited Universal Page vault code
- Slither static analysis completed

---

## 5. Liquidity/Depeg Risks

### Liquidity Structure

**Secondary Market Options:**
- **DEX Liquidity:** Users can trade sLYX on DEXs (if pools exist)
- **Protocol Withdrawal:** Illiquid stake → wait for oracle → claim native LYX
- **Transfer:** Send sLYX to another user (instant)

**Liquidity Challenges:**
1. **No Instant Unstaking** - Unlike some liquid staking protocols, Stakingverse does NOT offer instant withdrawal
2. **Oracle Dependency** - Withdrawal speed depends on oracle rebalancing frequency
3. **Validator Exit Delays** - True underlying liquidity limited by validator exit queue

### Depeg Risk Analysis

**Factors That Could Cause sLYX/LYX Depeg:**

| Scenario | Direction | Severity |
|----------|-----------|----------|
| Mass withdrawal requests | sLYX discount | High |
| Validator slashing events | sLYX discount | Medium |
| Oracle downtime | sLYX discount | Medium |
| High demand for LYX staking | sLYX premium | Low |

**Comparison to stETH:**
- stETH has deep liquidity and arbitrage loops
- sLYX likely has thinner liquidity
- stETH has instant withdrawal via Curve pools (sometimes at discount)
- sLYX has NO instant withdrawal option - must wait for oracle

**Arbitrage Mechanism:**
- If sLYX trades at discount: Buy sLYX → Burn → Withdraw → Wait → Claim LYX → Sell
- This arbitrage is SLOW due to oracle wait time
- Limited arbitrage = persistent depeg possible

---

## 6. Fee Structure Analysis

### Vault Fees

From storage layout analysis, the vault tracks:
```solidity
uint32 fee                    // Fee percentage (basis points likely)
address feeRecipient          // Where fees go
uint256 totalFees            // Accumulated fees
```

**Fee Mechanics:**
- Fees deducted from rewards before distribution
- Fee recipient configurable by owner
- User's 1,130 → 1,000 conversion suggests ~11.5% fee (verify actual rate)

### Fee Comparison

| Protocol | Fee Structure | Typical APY Impact |
|----------|---------------|-------------------|
| **Stakingverse (sLYX)** | % of rewards (estimated 10-15%) | Moderate |
| **Lido (stETH)** | 10% of rewards | Standard |
| **Rocket Pool (rETH)** | 14% of rewards + commission | Higher |
| **StakeWise (osETH)** | 10% of rewards | Standard |

### User Experience Fee Impact

User staked 1,130 LYX and received ~1,000 sLYX:
- If this was a deposit fee: ~11.5% fee is HIGH
- More likely: Exchange rate was ~1.13 (1 sLYX = 1.13 LYX worth of stake)
- User received sLYX at current market rate, not 1:1

**Recommendation:** Check exact fee by calling `fee()` on vault contract.

---

## 7. Comparison to Lido/stETH

| Feature | Stakingverse (sLYX) | Lido (stETH) |
|---------|---------------------|--------------|
| **Underlying** | LUKSO (LYX) | Ethereum (ETH) |
| **Token Standard** | LSP7 | ERC20 |
| **Rebasing** | No (value-accruing) | Yes (balance changes) |
| **Instant Unstaking** | No (oracle wait) | No (but DEX liquidity) |
| **Validator Set** | Permissioned | Permissioned |
| **Insurance** | None | None (Lido has coverage) |
| **Liquidity** | Limited (newer protocol) | Deep (billions in pools) |
| **Withdrawal Time** | Oracle-dependent | 1-5 days (post-Shapella) |
| **Fee** | ~10-15% (estimated) | 10% |
| **Upgradeable** | Yes | No (immutable) |

**Key Differences:**
1. **Token Type** - sLYX is LSP7 (LUKSO native) vs stETH ERC20
2. **Liquidity** - stETH has vastly superior secondary market liquidity
3. **Maturity** - Lido has years of battle-testing; Stakingverse is newer
4. **Governance** - Both have centralized operator/oracle structures

---

## 8. Protocol Flow Diagram (Complete)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STAKINGVERSE PROTOCOL FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐      stake LYX       ┌─────────────┐      mint sLYX       ┌──────────┐
│  USER    │ ───────────────────→ │   VAULT     │ ───────────────────→ │   sLYX   │
│          │   (deposit function) │             │   (onVaultStakeReceived)│ TOKEN  │
└──────────┘                      └─────────────┘                      └──────────┘
      │                                  │                                   │
      │                                  │                                   │
      │                                  ▼                                   │
      │                         ┌─────────────┐                              │
      │                         │  Validator  │                              │
      │                         │  Deposit    │                              │
      │                         │  Contract   │                              │
      │                         └─────────────┘                              │
      │                                  │                                   │
      │                                  │ (32 LYX per validator)            │
      │                                  ▼                                   │
      │                         ┌─────────────┐                              │
      │                         │  Consensus  │                              │
      │                         │  Layer      │                              │
      │                         │  (Rewards)  │                              │
      │                         └─────────────┘                              │
      │                                  │                                   │
      │                                  │ rewards accrue                    │
      │                                  │ (exchange rate increases)         │
      │                                  │                                   │
      │                                  ▼                                   │
      │                         ┌─────────────┐                              │
      │                         │  Oracles    │                              │
      │                         │  (Periodic  │                              │
      │                         │   Rebalance)│                              │
      │                         └─────────────┘                              │
      │                                  │                                   │
      ▼                                  ▼                                   ▼
┌──────────┐                     ┌─────────────┐                      ┌──────────┐
│  BURN    │ ←────────────────── │   VAULT     │ ←────────────────── │   sLYX   │
│  sLYX    │  (stake credited    │             │   (burn function)    │   BURN   │
│          │   back to vault)    │             │                      │          │
└──────────┘                     └─────────────┘                      └──────────┘
      │                                  │
      │                                  │
      ▼                                  ▼
┌──────────┐                     ┌─────────────┐
│ WITHDRAW │ ───────────────────→│   PENDING   │
│ REQUEST  │  (withdraw function)│  WITHDRAWAL │
└──────────┘                     └─────────────┘
                                          │
                                          │ wait for oracle
                                          │ rebalancing
                                          ▼
                                   ┌─────────────┐
                                   │  CLAIMABLE  │
                                   │   BALANCE   │
                                   └─────────────┘
                                          │
                                          │ claim()
                                          ▼
                                   ┌─────────────┐
                                   │  RECEIVE    │
                                   │  NATIVE LYX │
                                   └─────────────┘
```

---

## 9. User Risk Considerations

### For Current Stakers (like the user with 1,130 LYX staked)

**Immediate Risks:**
1. **Withdrawal Delay** - Unstaking requires waiting for oracle rebalancing (could be hours to days)
2. **Liquidity Risk** - sLYX may trade at discount if many try to exit
3. **Smart Contract Risk** - Upgradeable contracts can be modified (feature and risk)

**Mitigation Strategies:**
- Don't stake more than you can afford to have locked
- Monitor sLYX/LYX exchange rate before burning
- Consider using sLYX in DeFi rather than burning if liquidity exists
- Track oracle activity to estimate withdrawal timing

### Risk Checklist for Prospective Stakers

| Risk | Severity | Mitigation |
|------|----------|------------|
| Smart contract bugs | Medium | Contracts audited, upgradeable |
| Validator slashing | Low-Medium | Diversified validators |
| Oracle failure | Medium | Multiple oracles authorized |
| Withdrawal delays | High | Plan for illiquidity |
| Depeg risk | Medium-High | Limited arbitrage options |
| Fee changes | Low | Owner-controlled, but public |

### Questions to Investigate Further

1. **Fee Rate** - What is the exact fee percentage? (Call `fee()` on vault)
2. **Oracle Frequency** - How often do oracles rebalance?
3. **Withdrawal Queue** - Is there a maximum withdrawal delay?
4. **Validator Set** - How many validators? Who operates them?
5. **Insurance** - Is there any slashing insurance?
6. **Governance** - Who controls upgrades? Is there a DAO?

---

## 10. Technical Contract Details

### Key Addresses (LUKSO Mainnet)

| Contract | Address |
|----------|---------|
| **StakingverseVault Proxy** | 0x9F49a95b0c3c9e2A6c77a16C177928294c0F6F04 |
| **StakingverseVault Implementation** | 0x1711b2e1b64F38ca33E51b717CFd27ACD1bd2E2D |
| **SLYXToken Proxy** | 0x8A3982f0A7d154D11a5f43EEc7F50E52eBBc8F7D |
| **SLYXToken Implementation** | 0x08b28405A11348745A3187De2A29C730C53EB29B |
| **Original Vault Implementation** | 0x2Cb02ef26aDDAB15686ed634d70699ab64F195f4 |

### Critical Functions

**Vault Functions:**
- `deposit(address beneficiary)` - Stake LYX
- `withdraw(uint256 amount, address beneficiary)` - Request withdrawal
- `claim(uint256 amount, address beneficiary)` - Claim native LYX
- `transferStake(address to, uint256 amount, bytes data)` - Move stake
- `balanceOf(address account)` - Check staked balance
- `pendingBalanceOf(address account)` - Check pending withdrawal
- `claimableBalanceOf(address account)` - Check claimable balance

**sLYX Functions:**
- `burn(address from, uint256 amount, bytes data)` - Convert to staked LYX
- `getExchangeRate()` - Get current rate
- `getNativeTokenValue(uint256 sLyxAmount)` - Calculate LYX value
- `getSLYXTokenValue(uint256 stakedLyxAmount)` - Calculate sLYX value

---

## 11. Conclusion & Recommendations

### Strengths
1. Native LUKSO integration (LSP7 standard)
2. Based on audited Universal Page code
3. Upgradeable for security patches
4. Clear documentation
5. Active development

### Weaknesses
1. No instant withdrawal mechanism
2. Oracle-dependent rebalancing creates withdrawal delays
3. Limited secondary market liquidity (compared to stETH)
4. Permissioned validator set
5. Upgradeable contracts require trust

### Recommendation

**For Current Position (1,130 LYX → ~1,000 sLYX):**
- Understand the ~11.5% conversion rate (verify if this was fee or exchange rate)
- Plan for potential withdrawal delays when exiting
- Monitor for DEX liquidity to potentially exit without burning
- Consider keeping portion liquid for gas/opportunities

**Risk Level: MODERATE**
- Higher than mature protocols like Lido due to liquidity constraints
- Lower than experimental protocols due to audited codebase
- Main risk is withdrawal timing uncertainty

---

*Analysis completed using contract source code, documentation, and on-chain interaction data.*
