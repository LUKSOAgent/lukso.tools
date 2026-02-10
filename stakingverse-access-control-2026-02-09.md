# Stakingverse Access Control Audit Report

**Date:** 2026-02-09  
**Scope:** Stakingverse Liquid Staking Protocol (LUKSO Mainnet)  
**Contracts Audited:**
- StakingverseVault Proxy: `0x9F49a95b0c3c9e2A6c77a16C177928294c0F6F04`
- StakingverseVault Implementation: `0x1711b2e1b64F38ca33E51b717CFd27ACD1bd2E2D`
- SLYXToken Proxy: `0x8A3982f0A7d154D11a5f43EEc7F50E52eBBc8F7D`
- SLYXToken Implementation: `0x08b28405A11348745A3187De2A29C730C53EB29B`

---

## Executive Summary

Stakingverse is a liquid staking protocol on LUKSO that allows users to stake LYX and receive liquid sLYX tokens. The protocol uses a vault-based architecture with upgradeable contracts implementing OpenZeppelin's upgradeable libraries and custom access control patterns.

**Overall Risk Level: MEDIUM-HIGH**  
The protocol has significant centralization risks due to concentrated admin privileges, though the use of upgradeable proxies provides flexibility for security patches.

---

## 1. Permission Matrix

### 1.1 StakingverseVault Access Control

| Function | Modifier | Authorized Roles | Risk Level |
|----------|----------|------------------|------------|
| `initialize()` | `initializer` | One-time setup | N/A |
| `pause()` | `onlyOwner` | Owner only | 🔴 Critical |
| `unpause()` | `onlyOwner` | Owner only | 🔴 Critical |
| `setOperator()` | `onlyOperator` | Owner OR Operator | 🟡 High |
| `setFee()` | `onlyOperator` | Owner OR Operator | 🟡 High |
| `setFeeRecipient()` | `onlyOperator` | Owner OR Operator | 🟡 High |
| `setDepositLimit()` | `onlyOperator` | Owner OR Operator | 🟡 High |
| `enableOracle()` | `onlyOperator` | Owner OR Operator | 🟡 High |
| `allowlist()` | `onlyOperator` | Owner OR Operator | 🟡 High |
| `setRestricted()` | `onlyOperator` | Owner OR Operator | 🟡 High |
| `rebalance()` | `onlyOracle` | Enabled Oracles | 🟡 High |
| `registerValidator()` | `onlyOracle` | Enabled Oracles | 🟡 High |
| `claimFees()` | None | FeeRecipient only | 🟢 Low |

### 1.2 SLYXToken Access Control

| Function | Modifier | Authorized Roles | Risk Level |
|----------|----------|------------------|------------|
| `initialize()` | `initializer` | One-time setup | N/A |
| `pause()` | `onlyOwner` | Owner only | 🔴 Critical |
| `unpause()` | `onlyOwner` | Owner only | 🔴 Critical |
| `onVaultStakeReceived()` | `whenNotPaused` | Vault only (hardcoded) | 🟡 High |
| `burn()` | `whenNotPaused` | Any user (own tokens) | 🟢 Low |

### 1.3 Role Definitions

#### Owner Role (Both Contracts)
- **SLYXToken Owner:** Can pause/unpause minting and burning of sLYX tokens
- **Vault Owner:** Can pause/unpause vault operations AND all Operator functions
- **Pattern:** OpenZeppelin `OwnableUpgradeable` via `OwnableUnset`

#### Operator Role (Vault Only)
- **Set by:** Owner or current Operator via `setOperator()`
- **Capabilities:**
  - Change protocol fee (0-30% range)
  - Set fee recipient address
  - Set deposit limits
  - Enable/disable oracles
  - Manage allowlist for restricted mode
  - Enable/disable restricted mode
- **Pattern:** Custom `onlyOperator` modifier

#### Oracle Role (Vault Only)
- **Set by:** Operator via `enableOracle(address, bool)`
- **Capabilities:**
  - Call `rebalance()` to update vault accounting
  - Call `registerValidator()` to stake to beacon chain
- **Pattern:** Custom mapping `_oracles` with `onlyOracle` modifier

#### FeeRecipient Role (Vault Only)
- **Set by:** Operator via `setFeeRecipient()`
- **Capabilities:**
  - Claim accumulated fees via `claimFees()`
- **Pattern:** Single address check (not role-based)

---

## 2. Upgradeability Analysis

### 2.1 Proxy Pattern Used

The contracts use **OpenZeppelin's Transparent Upgradeable Proxy** pattern:

| Component | Address | Purpose |
|-----------|---------|---------|
| Vault Proxy | `0x9F49a95b0c3c9e2A6c77a16C177928294c0F6F04` | User-facing contract |
| Vault Implementation | `0x1711b2e1b64F38ca33E51b717CFd27ACD1bd2E2D` | Current logic contract |
| sLYX Proxy | `0x8A3982f0A7d154D11a5f43EEc7F50E52eBBc8F7D` | User-facing contract |
| sLYX Implementation | `0x08b28405A11348745A3187De2A29C730C53EB29B` | Current logic contract |

### 2.2 Upgrade Process

- **Who can upgrade:** Proxy admin (typically separate from contract owner)
- **How it works:** 
  - Proxy delegates all calls to implementation contract
  - `upgradeTo()` function on proxy changes implementation address
  - Storage is preserved in proxy, logic in implementation

### 2.3 Upgrade Risks

| Risk | Severity | Description |
|------|----------|-------------|
| Storage collision | High | Improper storage layout in new implementation can corrupt data |
| Function selector clashing | Medium | Transparent proxy protects against this |
| Admin key compromise | Critical | Admin can change logic arbitrarily |
| Initialization bypass | Medium | New implementations must be properly initialized |

### 2.4 Storage Layout

Both contracts use OpenZeppelin's upgradeable libraries with `__gap` arrays for future storage expansion:

**SLYXToken Storage:**
- Inherits from `Initializable`, `OwnableUpgradeable`, `PausableUpgradeable`, `LSP7BurnableInitAbstract`
- Gap arrays at slots: 1, 52, 101, 158
- Custom storage at slot 207: `stakingVault`

**StakingverseVault Storage:**
- Inherits from `OwnableUnset`, `ReentrancyGuardUpgradeable`, `PausableUpgradeable`
- Gap arrays at slots: 2, 51, 102
- Custom state variables from slot 151 onwards

---

## 3. Pause/Mint/Burn Permissions Analysis

### 3.1 Pause Functionality

| Contract | Pause Function | Can Pause | Effect When Paused |
|----------|---------------|-----------|-------------------|
| SLYXToken | `pause()` / `unpause()` | Owner only | Blocks `onVaultStakeReceived()` and `burn()` |
| Vault | `pause()` / `unpause()` | Owner only | Blocks `deposit()`, `withdraw()`, `claim()`, `transferStake()`, `rebalance()`, `registerValidator()` |

### 3.2 Mint Permissions

**sLYX Minting:**
- **Who can mint:** Only the linked Vault contract
- **How:** Calling `onVaultStakeReceived()` hook when stake is transferred to sLYX contract
- **Restriction:** Can be paused by SLYXToken owner
- **Code:**
  ```solidity
  function onVaultStakeReceived(address from, uint256 amount, bytes calldata data) 
      external 
      whenNotPaused 
  {
      if (msg.sender != address(stakingVault)) {
          revert OnlyVaultAllowedToMintSLYX(msg.sender);
      }
      // ... mint logic
  }
  ```

### 3.3 Burn Permissions

**sLYX Burning:**
- **Who can burn:** Any address can burn their own sLYX tokens
- **How:** Calling `burn(from, amount, data)` 
- **Restriction:** Can be paused by SLYXToken owner
- **Effect:** Converts sLYX back to staked LYX in vault (via `_afterTokenTransfer` hook)

### 3.4 Validator Staking Permissions

**Validator Registration:**
- **Who can register:** Enabled oracles only
- **How:** Calling `registerValidator(pubkey, signature, depositDataRoot)`
- **Amount:** Exactly 32 LYX per validator
- **Destination:** LUKSO Deposit Contract
- **Withdrawal Credentials:** `0x010000000000000000000000 + vaultAddress`

---

## 4. Validator Management Permissions

### 4.1 Validator Lifecycle

| Action | Authorized Caller | Requirements |
|--------|------------------|--------------|
| Register validator | Oracle (enabled) | `totalUnstaked >= 32 LYX`, pubkey not already registered |
| Batch register | Oracle (enabled) | Multiple validators at once |
| Exit validator | N/A (beacon chain) | Controlled by validator keys |

### 4.2 Key Storage

Validator public keys are stored in `_registeredKeys` mapping to prevent double-registration:

```solidity
mapping(bytes => bool) private _registeredKeys;
```

### 4.3 Rebalancing

Oracles periodically call `rebalance()` to:
1. Account for completed validator withdrawals
2. Distribute rewards to stakers
3. Calculate and allocate fees

---

## 5. Centralization Risk Assessment

### 5.1 Critical Centralization Vectors

| Vector | Risk | Current Mitigation |
|--------|------|-------------------|
| **Single Owner** | Owner can pause/unpause entire protocol | None visible |
| **Single Operator** | Operator controls fees, limits, allowlists | Owner can override via `onlyOperator` check |
| **Oracle Centralization** | Oracles control validator registration and rebalancing | Multiple oracles can be enabled |
| **Proxy Admin** | Can upgrade contract logic arbitrarily | Not visible in source code |
| **Fee Recipient** | Single address receives all fees | Operator can change recipient |

### 5.2 Privileged Address Exposure

The following addresses have elevated privileges:

1. **Vault Owner Address**
   - Full pause/unpause control
   - Can change operator
   - Cannot be changed without ownership transfer

2. **Operator Address**
   - Day-to-day protocol management
   - Can be changed by owner or current operator

3. **Enabled Oracles**
   - Control validator lifecycle
   - Control reward distribution timing
   - Can be enabled/disabled by operator

### 5.3 Single Points of Failure

| Component | SPOF? | Impact |
|-----------|-------|--------|
| Owner | Yes | Can freeze all funds via pause |
| Operator | Partial | Owner can replace compromised operator |
| Oracles | Partial | Multiple can be enabled |
| Fee Recipient | Yes | Single recipient for all fees |

---

## 6. Admin Key Security Considerations

### 6.1 Key Management Risks

1. **Owner Key Compromise**
   - Attacker could pause protocol indefinitely
   - Attacker could change operator to malicious address
   - Attacker could upgrade contract to drain funds (if also proxy admin)

2. **Operator Key Compromise**
   - Attacker could set fees to maximum (30%)
   - Attacker could set deposit limit to zero
   - Attacker could enable malicious oracles
   - Owner can recover by changing operator

3. **Oracle Key Compromise**
   - Attacker could register invalid validators
   - Attacker could manipulate rebalance calculations
   - Limited impact due to validation checks

### 6.2 Recommended Security Measures

| Measure | Status | Priority |
|---------|--------|----------|
| Multi-sig for Owner | Unknown | 🔴 Critical |
| Multi-sig for Operator | Unknown | 🟡 High |
| Timelock for critical operations | Unknown | 🟡 High |
| Hardware security modules | Unknown | 🟢 Medium |
| Emergency pause monitoring | Unknown | 🟡 High |

---

## 7. Recommendations for Trust Minimization

### 7.1 Immediate Actions (High Priority)

1. **Implement Timelock Contract**
   - Add 24-48 hour delay on critical operations
   - Affected functions: `setFee()`, `setFeeRecipient()`, `setOperator()`, `upgradeTo()`
   - Reduces impact of compromised keys

2. **Transfer Ownership to Multi-sig**
   - Use Gnosis Safe or similar with 3-of-5 threshold
   - Separate owner and operator multi-sigs
   - Document signers and rotation procedures

3. **Enable Multiple Oracles**
   - Require M-of-N oracle consensus for rebalance
   - Use Chainlink or decentralized oracle networks
   - Prevents single oracle manipulation

### 7.2 Short-term Improvements (Medium Priority)

4. **Add Emergency Withdrawal Function**
   - Allow users to exit even when paused
   - Protects users from indefinite lockup
   - Example: `emergencyWithdraw()` that bypasses pause

5. **Implement Fee Change Caps**
   - Limit fee changes to X% per day
   - Prevents sudden 0% → 30% fee jumps
   - Gives users time to react

6. **Add Operator Action Limits**
   - Restrict how quickly deposit limits can be reduced
   - Prevent operator from blocking deposits abruptly

### 7.3 Long-term Decentralization (Lower Priority)

7. **Transition to DAO Governance**
   - Move owner to governance contract
   - Token holders vote on parameter changes
   - Gradual decentralization roadmap

8. **Validator Key Distribution**
   - Use DVT (Distributed Validator Technology)
   - Prevents single operator from controlling validators
   - Consider SSV Network or Obol

9. **Open Source Oracle Code**
   - Publish oracle implementation
   - Allow community verification of rebalance logic
   - Consider on-chain ZK verification

### 7.4 Monitoring Recommendations

10. **Real-time Monitoring**
    - Alert on all owner/operator actions
    - Monitor pause state changes
    - Track fee recipient changes
    - Monitor validator registration patterns

11. **On-chain Transparency**
    - Emit events for all privileged actions
    - Index events for easy querying
    - Publish regular transparency reports

---

## 8. Code Quality Observations

### 8.1 Positive Security Features

✅ **Reentrancy Protection**: Uses `ReentrancyGuardUpgradeable` on state-changing functions  
✅ **Input Validation**: Extensive checks on addresses, amounts, and permissions  
✅ **Event Emissions**: Comprehensive events for off-chain monitoring  
✅ **Pausable Pattern**: Emergency pause capability implemented correctly  
✅ **Upgradeable Pattern**: Uses standard OZ upgradeable libraries  
✅ **Access Control**: Clear role separation (Owner/Operator/Oracle)  

### 8.2 Areas of Concern

⚠️ **Centralized Control**: Too much power concentrated in single addresses  
⚠️ **No Timelock**: Critical changes can happen instantly  
⚠️ **Oracle Trust**: Rebalance logic depends on trusted oracles  
⚠️ **Fee Recipient**: Single point of failure for fee collection  
⚠️ **Pause Risk**: Owner can freeze all user funds indefinitely  

### 8.3 Slither Findings Summary

From automated analysis:

| Severity | Count | Key Issues |
|----------|-------|------------|
| High | 2 | Arbitrary ETH sends in `claimFees` and `registerValidator` |
| Medium | 5 | Strict equality comparisons (acceptable design choices) |
| Low | 1 | External calls inside loop in `registerValidators` |

**Note:** High-severity findings relate to expected functionality (sending ETH to beneficiaries and deposit contract) rather than vulnerabilities.

---

## 9. Conclusion

The Stakingverse protocol implements a functional liquid staking system with reasonable security practices. However, it exhibits **significant centralization risks** that could lead to:

1. **Censorship**: Operator can block deposits/withdrawals via allowlist
2. **Fee Extraction**: Operator can increase fees to 30% instantly
3. **Fund Freezing**: Owner can pause all operations indefinitely
4. **Upgrade Risk**: Proxy admin can change logic arbitrarily

### Risk Summary

| Category | Rating | Notes |
|----------|--------|-------|
| Smart Contract Security | 🟡 Medium | Standard patterns, but centralization concerns |
| Admin Key Security | 🔴 High Risk | No visible multi-sig or timelock |
| Decentralization | 🔴 High Risk | Concentrated control in few addresses |
| Upgrade Risk | 🟡 Medium | Standard proxy pattern, requires trust |
| Oracle Risk | 🟡 Medium | Trusted oracles, but replaceable |

### Final Recommendation

**Proceed with Caution**: The protocol is functional but requires trust in the Stakingverse team. Users should:

1. Monitor the proxy implementation address for unexpected changes
2. Watch for pause events
3. Be aware that fees can change instantly (up to 30%)
4. Consider the BUSL-1.1 license (commercial use restricted until April 2027)

**Minimum Recommended Changes Before Large-Scale Usage:**
- Implement timelock on critical functions
- Transfer ownership to verified multi-sig
- Enable multiple independent oracles

---

## Appendix A: Contract Addresses

### LUKSO Mainnet

| Contract | Address |
|----------|---------|
| Vault Proxy | `0x9F49a95b0c3c9e2A6c77a16C177928294c0F6F04` |
| Vault Implementation | `0x1711b2e1b64F38ca33E51b717CFd27ACD1bd2E2D` |
| Old Vault Implementation | `0x2Cb02ef26aDDAB15686ed634d70699ab64F195f4` |
| sLYX Proxy | `0x8a3982f0a7d154d11a5f43eec7f50e52ebbc8f7d` |
| sLYX Implementation | `0x08b28405A11348745A3187De2A29C730C53EB29B` |

### LUKSO Testnet

| Contract | Address |
|----------|---------|
| Vault Proxy | `0x420458294FC1AdAdA36773866A33BC2C8E8E68eF` |
| sLYX Proxy | `0x796b1fdcDE61280EF51B94f5a68132941856ec0c` |

---

## Appendix B: Key Function Signatures

```solidity
// Ownership
function owner() external view returns (address);
function transferOwnership(address newOwner) external;

// Pausing
function pause() external; // onlyOwner
function unpause() external; // onlyOwner
function paused() external view returns (bool);

// Vault Operator
function operator() external view returns (address);
function setOperator(address newOperator) external; // onlyOperator

// Vault Oracles
function enableOracle(address oracle, bool enabled) external; // onlyOperator
function isOracle(address oracle) external view returns (bool);

// Vault Fees
function fee() external view returns (uint32); // basis points / 100,000
function setFee(uint32 newFee) external; // onlyOperator, max 30%
function feeRecipient() external view returns (address);
function setFeeRecipient(address newFeeRecipient) external; // onlyOperator

// Vault Restrictions
function restricted() external view returns (bool);
function setRestricted(bool enabled) external; // onlyOperator
function allowlist(address account, bool enabled) external; // onlyOperator

// Validator Management
function registerValidator(bytes calldata pubkey, bytes calldata signature, bytes32 depositDataRoot) external; // onlyOracle
function rebalance() external; // onlyOracle
```

---

## Appendix C: External References

- **Documentation:** https://docs.stakingverse.io/
- **GitHub:** https://github.com/Stakingverse/pool-contracts
- **LUKSO Explorer:** https://explorer.lukso.network/
- **License:** BUSL-1.1 (relicensing to GPL-3.0 on April 1, 2027)

---

*Report generated: 2026-02-09*  
*Auditor: OpenClave Security Subagent*  
*Source: On-chain analysis + GitHub source code review*
