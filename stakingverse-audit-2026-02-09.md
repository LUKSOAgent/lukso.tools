# Stakingverse.io Liquid Staking Protocol Security Audit

**Audit Date:** 2026-02-09  
**Auditor:** Security Analysis Agent  
**Network:** LUKSO Mainnet  
**Protocol:** Stakingverse.io Liquid Staking

---

## 1. Executive Summary

Stakingverse is a liquid staking protocol on LUKSO that allows users to stake LYX tokens and receive sLYX (liquid staking tokens) in return. The protocol manages staking through a vault architecture with oracle-based rebalancing and validator registration.

**Overall Risk Assessment:** MEDIUM-HIGH ⚠️

Key concerns include centralized control structures, upgradeable proxy risks, and the need for external oracle trust. The codebase follows OpenZeppelin standards but has significant privilege concentration.

---

## 2. Contract Inventory

| Contract | Address | Type | Status |
|----------|---------|------|--------|
| **StakingverseVault (Proxy)** | 0x9F49a95b0c3c9e2A6c77a16C177928294c0F6F04 | TransparentUpgradeableProxy | ✅ Verified |
| **StakingverseVault (Impl)** | 0x1711b2e1b64f38ca33e51b717cfd27acd1bd2e2d | StakingverseVault | ✅ Verified |
| **sLYX/KeyManager** | 0xad5481e02f8cdaabd1d3f04b7953de0fdb53f048 | LSP6KeyManagerInit | ✅ Verified |
| **UniversalProfile** | 0x293e96ebbf264ed7715cff2b67850517de70232a | UniversalProfileInit | ✅ Verified |

---

## 3. Contract Verification Status

All contracts are **fully verified** on LUKSO explorer with source code available:

- **Proxy Contract:** TransparentUpgradeableProxy pattern from OpenZeppelin
- **Implementation:** Solidity 0.8.22, 1000 optimization runs
- **Libraries Used:** 
  - OpenZeppelin Contracts v4.9.0 (upgradeable)
  - LUKSO LSP Standards (LSP0, LSP6, LSP14, LSP17, LSP20)
  - ERC725 implementations

---

## 4. Key Functions Analysis

### 4.1 Staking Flow

```solidity
function deposit(address beneficiary) public payable override nonReentrant whenNotPaused
```

**Analysis:**
- Accepts LYX deposits and mints shares to beneficiary
- First depositor protection with minimum shares requirement (1000 wei)
- Shares-based accounting for yield distribution
- Reentrancy protected with `nonReentrant` modifier

**Input Validation:**
- ✅ Checks `beneficiary != address(0)`
- ✅ Validates `amount > 0`
- ✅ Checks deposit limits
- ✅ Restricted mode support for allowlisted addresses

### 4.2 Withdrawal Flow

```solidity
function withdraw(uint256 amount, address beneficiary) external override nonReentrant whenNotPaused
```

**Analysis:**
- Burns shares and returns LYX to beneficiary
- Handles immediate vs delayed withdrawals
- Immediate withdrawal limited to `totalUnstaked` balance
- Excess amounts go to pending withdrawal queue

**Security Observations:**
- ⚠️ Delayed withdrawals create pending balances that require oracle rebalancing
- ✅ Proper balance checks before share burning
- ✅ Reentrancy protected

### 4.3 Oracle Rebalancing

```solidity
function rebalance() external onlyOracle nonReentrant whenNotPaused
```

**Analysis:**
- Called periodically by oracle to update staked/unstaked balances
- Accounts for completed validator withdrawals
- Distributes rewards with fee calculation
- **Critical:** Assumes validator penalties "shall not occur or shall be negligible"

**Security Concerns:**
- 🔴 **HIGH:** No slashing protection mentioned
- 🔴 **HIGH:** Oracle has significant control over fund accounting
- ⚠️ Fee calculation: 0-30% configurable (currently set by operator)

### 4.4 Validator Registration

```solidity
function registerValidator(bytes calldata pubkey, bytes calldata signature, bytes32 depositDataRoot)
    public onlyOracle nonReentrant whenNotPaused
```

**Analysis:**
- Registers 32 LYX validators on LUKSO beacon chain
- Deposits to official LUKSO deposit contract: 0xCAfe00000000000000000000000000000000CAfe
- Prevents duplicate validator registration via `_registeredKeys` mapping

**Security:**
- ✅ Validates sufficient unstaked balance
- ✅ Prevents double-registration
- ⚠️ Oracle-controlled validator selection

---

## 5. Vulnerability Analysis

### 5.1 Reentrancy

**Status:** ✅ MITIGATED

- Uses OpenZeppelin's `ReentrancyGuardUpgradeable`
- `nonReentrant` modifier on all state-changing functions
- Proper CEI (Checks-Effects-Interactions) pattern in withdrawal functions

### 5.2 Access Control

**Status:** ⚠️ MEDIUM RISK

**Privileged Roles:**

| Role | Capabilities | Risk Level |
|------|--------------|------------|
| **Owner** | Can pause/unpause, transfer ownership | High |
| **Operator** | Can set fees, deposit limits, add oracles | Critical |
| **Oracle** | Can rebalance, register validators, affect user balances | Critical |
| **Fee Recipient** | Can claim accumulated fees | Low |

**Findings:**
- 🔴 **CRITICAL:** Single-operator control over fee structure (0-30%)
- 🔴 **CRITICAL:** Oracle has unilateral control over balance accounting
- ⚠️ No timelock mechanism for privileged operations
- ⚠️ No multisig requirement for critical functions

### 5.3 Oracle Manipulation

**Status:** 🔴 HIGH RISK

**Issues:**
1. **Centralized Oracle:** `rebalance()` function can only be called by oracle addresses
2. **No On-Chain Verification:** Oracle reports are trusted without cryptographic verification
3. **Balance Manipulation:** Oracle controls `totalStaked`, `totalUnstaked`, `totalClaimable` values
4. **No Slashing Protection:** Code comments explicitly state penalties are "assumed negligible"

**Attack Scenario:**
- Compromised oracle could:
  - Report incorrect balances to steal funds
  - Manipulate fee distribution
  - Block withdrawals by manipulating `totalClaimable`

### 5.4 Integer Overflow/Underflow

**Status:** ✅ MITIGATED

- Solidity 0.8.22 used (built-in overflow protection)
- Uses OpenZeppelin's `Math` library for safe calculations
- Proper share-to-balance conversion with overflow checks

### 5.5 Upgradeability Risks

**Status:** ⚠️ MEDIUM RISK

**Proxy Pattern:** TransparentUpgradeableProxy

**Risks:**
- Admin key compromise could lead to complete fund theft via implementation upgrade
- No upgrade timelock mechanism visible
- Implementation address can be changed by proxy admin

**Constructor Arguments (Proxy):**
```
_logic: 0x1711b2e1b64f38ca33e51b717cfd27acd1bd2e2d
admin_: 0x8909ce174b12be1311ba80797d2f3a8bedd913bf
```

### 5.6 External Dependencies

**Status:** ⚠️ MEDIUM RISK

| Dependency | Address | Risk |
|------------|---------|------|
| LUKSO Deposit Contract | 0xCAfe00000000000000000000000000000000CAfe | Official, Low Risk |
| LSP Standards | Various | Audited by LUKSO, Low Risk |
| OpenZeppelin | v4.9.0 | Well-audited, Low Risk |

---

## 6. User Transaction Analysis

### Transaction 1: Staking
**Hash:** `0xe6fc49ee3d87f8c02b362ebdfa25aa141b1dc7a4f8d152f2e9f05212dc6cd5c1`
- **Value:** 10 LYX
- **Function:** deposit() via KeyManager
- **Status:** ✅ Successful
- **Gas Used:** 144,685

### Transaction 2: Staking
**Hash:** `0xde97589630a8b35dcf135fae768188450e2e0349e4ba81efdd8d4316c9745b57`
- **Value:** 444.4 LYX
- **Function:** deposit() via KeyManager
- **Status:** ✅ Successful
- **Gas Used:** 117,251

**Observations:**
- Both transactions used the LSP6 KeyManager for permissioned execution
- Deposits properly credited to beneficiary addresses
- No anomalies detected in transaction flow

---

## 7. Permission Structures

### Vault Permissions

```solidity
// Core Permissions
onlyOwner()     - Full administrative control
onlyOperator()  - Fee and configuration management
onlyOracle()    - Rebalancing and validator registration
```

### KeyManager Permissions (LSP6)

The sLYX token uses LSP6 KeyManager with granular permissions:
- `REENTRANCY` - Reentrancy permission
- `SUPER_TRANSFERVALUE` - Transfer with value
- `TRANSFERVALUE` - Basic transfer
- `CALL` - External calls
- `DEPLOY` - Contract deployment
- `SETDATA` - Data modification

---

## 8. Security Recommendations

### 🔴 Critical Priority

1. **Implement Oracle Decentralization**
   - Use multiple oracles with consensus mechanism
   - Require threshold signatures for rebalancing
   - Consider Chainlink or similar decentralized oracle networks

2. **Add Slashing Protection**
   - Implement validator slashing detection
   - Account for penalties in balance calculations
   - Create insurance mechanism for slashed funds

3. **Upgrade Timelock**
   - Add 48-72 hour timelock for proxy upgrades
   - Require multisig for admin operations
   - Consider governance token for protocol decisions

### ⚠️ High Priority

4. **Fee Structure Limits**
   - Reduce maximum fee from 30% to reasonable maximum (e.g., 10%)
   - Add fee change timelock
   - Require governance for fee increases

5. **Emergency Pause Improvements**
   - Add automatic unpause conditions
   - Create emergency withdrawal mechanism
   - Document pause procedures

### ✅ Medium Priority

6. **Monitoring and Alerts**
   - Implement real-time monitoring for oracle activity
   - Alert on unusual balance changes
   - Monitor validator performance

7. **Documentation**
   - Document all privileged roles and their responsibilities
   - Create incident response procedures
   - Publish security audit guidelines

---

## 9. Risk Assessment Matrix

| Risk Category | Severity | Likelihood | Impact | Status |
|---------------|----------|------------|--------|--------|
| Oracle Compromise | Critical | Medium | Catastrophic | ⚠️ Active |
| Upgrade Key Theft | Critical | Low | Catastrophic | ⚠️ Active |
| Validator Slashing | High | Medium | High | 🔴 Unaddressed |
| Fee Manipulation | High | Low | High | ⚠️ Active |
| Reentrancy | Low | Low | Medium | ✅ Mitigated |
| Integer Overflow | Low | Low | Low | ✅ Mitigated |

---

## 10. Conclusion

The Stakingverse protocol implements a standard liquid staking architecture with proper use of established libraries (OpenZeppelin, LUKSO standards). The codebase shows good engineering practices with reentrancy protection, input validation, and access control.

However, the protocol has **significant centralization risks** that should be addressed before handling large amounts of value. The oracle-dependent architecture creates a single point of failure that could lead to complete fund loss if compromised.

**Recommendations:**
- **For Users:** Understand the risks of centralized oracle control
- **For Protocol:** Prioritize oracle decentralization and slashing protection
- **Timeline:** Address critical issues within 30 days before major TVL growth

---

## Appendix A: Key Addresses

| Description | Address |
|-------------|---------|
| Vault Proxy | 0x9F49a95b0c3c9e2A6c77a16C177928294c0F6F04 |
| Vault Implementation | 0x1711b2e1b64f38ca33e51b717cfd27acd1bd2e2d |
| KeyManager (sLYX) | 0xad5481e02f8cdaabd1d3f04b7953de0fdb53f048 |
| UniversalProfile | 0x293e96ebbf264ed7715cff2b67850517de70232a |
| LUKSO Deposit Contract | 0xCAfe00000000000000000000000000000000CAfe |
| Proxy Admin | 0x8909ce174b12be1311ba80797d2f3a8bedd913bf |

## Appendix B: Transaction Hashes Analyzed

| Tx Hash | Block | Type | Value |
|---------|-------|------|-------|
| 0xe6fc49ee3d87f8c02b362ebdfa25aa141b1dc7a4f8d152f2e9f05212dc6cd5c1 | 6908217 | Stake | 10 LYX |
| 0xde97589630a8b35dcf135fae768188450e2e0349e4ba81efdd8d4316c9745b57 | 6908244 | Stake | 444.4 LYX |

---

*This audit is based on on-chain contract analysis and publicly available source code. It does not constitute financial advice. Users should conduct their own due diligence before interacting with the protocol.*
